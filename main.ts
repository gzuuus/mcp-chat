#!/usr/bin/env deno run --allow-env --allow-net --allow-read

import { Assistant } from "./assistant.ts";
import { TUI } from "./tui.ts";
import { loadConfig, validateConfig } from "./config.ts";
import type { AssistantConfig } from "./types.ts";

/**
 * Main application class
 */
class MCPChat {
  private assistant: Assistant;
  private tui: TUI;
  private running = false;
  private mcpEnabled: boolean;

  constructor(enableMCP = true) {
    this.mcpEnabled = enableMCP;

    // Initialize TUI with dynamic configuration
    this.tui = new TUI(this.createTUIConfig());

    // Initialize assistant with configuration
    try {
      this.assistant = new Assistant(this.createAssistantConfig());
    } catch (error) {
      this.handleConfigurationError(error);
    }
  }

  /**
   * Create TUI configuration based on enabled features
   */
  private createTUIConfig() {
    if (this.mcpEnabled) {
      return {
        title: "MCP Chat",
        welcomeMessage: "Welcome to MCP Chat\n\n" +
          "Try asking questions that can utilize MCP tools\n\n" +
          'Type "/help" for available commands.',
      };
    }

    return {
      title: "MCP Chat",
      welcomeMessage:
        'Welcome to MCP Chat! Start chatting with the AI assistant.\nType "/help" for available commands.',
    };
  }

  /**
   * Create assistant configuration based on enabled features
   */
  private createAssistantConfig(): AssistantConfig {
    const baseConfig = loadConfig();
    validateConfig(baseConfig);

    const config: AssistantConfig = {
      ...baseConfig,
      ...(this.mcpEnabled && { mcpEnabled: true }),
    };

    if (this.mcpEnabled) {
      config.system =
        "You are a helpful AI assistant with access to MCP (Model Context Protocol) servers that provide various tools and resources. " +
        "Use the available MCP tools when needed to help answer questions and perform tasks. ";
    }

    return config;
  }

  /**
   * Handle configuration errors with consistent messaging
   */
  private handleConfigurationError(error: unknown): never {
    this.tui.showError(
      `Configuration error: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    this.tui.showInfo("Please check your environment variables:");
    this.tui.showInfo("- OPENAI_API_KEY or OPENAI_KEY (required)");
    this.tui.showInfo("- OPENAI_BASE_URL (optional)");
    this.tui.showInfo("- MODEL_ID (optional, defaults to gpt-3.5-turbo)");
    Deno.exit(1);
  }

  /**
   * Start the chat application
   */
  async run(): Promise<void> {
    this.running = true;
    this.tui.showBanner();

    // Initialize MCP if enabled
    if (this.mcpEnabled) {
      try {
        // Set up elicitation handler
        this.assistant.setElicitationHandler(async (request) => {
          const result = await this.tui.getElicitationInput(
            request.params.requestedSchema.properties,
            request.params.requestedSchema.required,
          );

          if (result === null) {
            return { action: "cancel", content: undefined };
          } else {
            return { action: "accept", content: result };
          }
        });

        await this.assistant.initializeMCP();
        const serverCount = this.assistant.getMCPServerCount();
        if (serverCount > 0) {
          this.tui.showInfo(`🔌 ${serverCount} MCP server(s) connected`);
        } else {
          this.tui.showInfo("⚠️  No MCP servers found");
        }
      } catch (error) {
        this.tui.showError(
          `MCP initialization failed: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    while (this.running) {
      try {
        // Get user input
        const input = await this.tui.getUserInput();

        // Handle empty input
        if (!input.trim()) {
          continue;
        }

        // Handle commands
        if (input.startsWith("/")) {
          this.handleCommand(input);
          continue;
        }

        // Show user message
        this.tui.showUserMessage(input);

        // Show assistant header and stream response
        this.tui.showAssistantHeader();

        for await (const chunk of this.assistant.message(input)) {
          this.tui.showAssistantChunk(chunk);
        }

        this.tui.completeAssistantMessage();
      } catch (error) {
        if (error instanceof Deno.errors.Interrupted) {
          // Handle Ctrl+C gracefully
          this.tui.showInfo("\nGoodbye! 👋");
          await this.cleanup();
          break;
        }

        this.tui.showError(
          `An error occurred: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }
  }

  /**
   * Handle slash commands
   */
  private handleCommand(command: string): void {
    const cmd = command.toLowerCase().trim();

    const commands: Record<string, () => void> = {
      "/quit": () => this.handleExit(),
      "/exit": () => this.handleExit(),
      "/help": () => this.handleHelp(),
      "/clear": () => this.handleClear(),
      "/history": () => this.handleHistory(),
      "/reset": () => this.handleReset(),
      "/mcp": () =>
        this.handleFeatureCommand(
          "mcp",
          this.mcpEnabled,
          this.showMCPInfo.bind(this),
        ),
      "/servers": () =>
        this.handleFeatureCommand(
          "servers",
          this.mcpEnabled,
          this.showMCPServerInfo.bind(this),
        ),
    };

    const handler = commands[cmd];
    if (handler) {
      handler();
    } else {
      this.tui.showError(`Unknown command: ${command}`);
      this.tui.showInfo('Type "/help" to see available commands.');
    }
  }

  private handleExit(): void {
    this.tui.showInfo("Goodbye! 👋");
    this.running = false;
  }

  private handleHelp(): void {
    this.tui.showHelp();
    if (this.mcpEnabled) this.showMCPHelp();
  }

  private handleClear(): void {
    this.tui.clearScreen();
    this.tui.showBanner();
  }

  private handleHistory(): void {
    this.tui.showHistory(this.assistant.getHistory());
  }

  private handleReset(): void {
    this.assistant.clearHistory();
    this.tui.showInfo("Conversation history cleared.");
  }

  /**
   * Handle feature-specific commands with consistent error handling
   */
  private handleFeatureCommand(
    featureName: string,
    enabled: boolean,
    action: () => void,
  ): void {
    if (enabled) {
      action();
    } else {
      const errorMessages: Record<string, string> = {
        tools:
          "Tools are not enabled. Use 'deno task dev --tools' to enable tools.",
        mcp: "MCP is not enabled. Use 'deno task dev --mcp' to enable MCP.",
        servers: "MCP is not enabled.",
      };
      this.tui.showError(
        errorMessages[featureName] || `${featureName} is not enabled.`,
      );
    }
  }

  /**
   * Generic helper for displaying sectioned information
   */
  private displaySection(title: string, items: string[], width = 30): void {
    console.log(`\n${title}`);
    console.log("━".repeat(width));
    items.forEach((item) => console.log(item));
    console.log("━".repeat(width));
  }

  /**
   * Show MCP help
   */
  private showMCPHelp(): void {
    this.displaySection("🔌 MCP Commands:", [
      "/mcp      - Show MCP status and information",
      "/servers  - Show detailed server information",
    ]);

    console.log("\n💡 MCP tools are automatically available to the AI");
    console.log("Ask questions that might require external data or actions!");
  }

  /**
   * Show MCP information
   */
  private showMCPInfo(): void {
    console.log("\n🔌 MCP (Model Context Protocol) Information:");
    console.log("━".repeat(50));

    if (this.assistant.isMCPEnabled()) {
      const serverCount = this.assistant.getMCPServerCount();
      const serverInfo = this.assistant.getMCPServerInfo();
      const totalTools = serverInfo.reduce(
        (sum, server) => sum + server.toolCount,
        0,
      );

      console.log(`Status: ✅ Connected to ${serverCount} server(s)`);
      console.log(`Total MCP Tools: ${totalTools}`);
      console.log("\n📡 Connected Servers:");
      serverInfo.forEach((server) => {
        console.log(`   • ${server.name}: ${server.toolCount} tools`);
      });
    } else {
      console.log("Status: ❌ Not initialized");
    }

    console.log("━".repeat(50));
    console.log("\n💡 Available commands:");
    console.log("- /servers  - Show detailed server information");
    console.log("- /mcp      - Show this MCP information");
  }

  /**
   * Show detailed MCP server information
   */
  private showMCPServerInfo(): void {
    console.log("\n📡 MCP Server Details:\n");

    const serverInfo = this.assistant.getMCPServerInfo();
    if (serverInfo.length === 0) {
      console.log("No MCP servers connected.");
      return;
    }

    serverInfo.forEach((server) => {
      console.log(`🖥️  Server: ${server.name}`);
      console.log(
        `   Status: ${server.connected ? "✅ Connected" : "❌ Disconnected"}`,
      );
      console.log(`   Tools: ${server.toolCount}`);

      if (server.tools.length > 0) {
        console.log("   Available Tools:");
        server.tools.forEach((tool) => console.log(`     • ${tool}`));
      }
      console.log();
    });
  }

  /**
   * Cleanup resources
   */
  private async cleanup(): Promise<void> {
    if (this.mcpEnabled) {
      await this.assistant.cleanup();
    }
  }
}

/**
 * Application entry point
 */
async function main(): Promise<void> {
  // Handle Ctrl+C gracefully
  Deno.addSignalListener("SIGINT", () => {
    console.log("\n\nGoodbye! 👋");
    Deno.exit(0);
  });

  // Check for MCP flag (enabled by default)
  const enableMCP = !Deno.args.includes("--no-mcp");

  const app = new MCPChat(enableMCP);
  await app.run();
}

// Run the application if this is the main module
if (import.meta.main) {
  await main();
}
