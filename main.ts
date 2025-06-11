#!/usr/bin/env deno run --allow-env --allow-net --allow-read

import { Assistant } from "./assistant.ts";
import { TUI } from "./tui.ts";
import { loadConfig, validateConfig } from "./config.ts";

/**
 * Main application class
 */
class MCPChat {
  private assistant: Assistant;
  private tui: TUI;
  private running = false;

  constructor() {
    this.tui = new TUI({
      title: "MCP Chat",
      welcomeMessage:
        'Welcome to MCP Chat! Start chatting with the AI assistant.\nType "/help" for available commands.',
    });

    // Load and validate configuration
    try {
      const config = loadConfig();
      validateConfig(config);
      this.assistant = new Assistant(config);
    } catch (error) {
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
  }

  /**
   * Start the chat application
   */
  async run(): Promise<void> {
    this.running = true;
    this.tui.showBanner();

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
          await this.handleCommand(input);
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

    switch (cmd) {
      case "/quit":
      case "/exit":
        this.tui.showInfo("Goodbye! 👋");
        this.running = false;
        break;

      case "/help":
        this.tui.showHelp();
        break;

      case "/clear":
        this.tui.clearScreen();
        this.tui.showBanner();
        break;

      case "/history":
        this.tui.showHistory(this.assistant.getHistory());
        break;

      case "/reset":
        this.assistant.clearHistory();
        this.tui.showInfo("Conversation history cleared.");
        break;

      default:
        this.tui.showError(`Unknown command: ${command}`);
        this.tui.showInfo('Type "/help" to see available commands.');
        break;
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

  const app = new MCPChat();
  await app.run();
}

// Run the application if this is the main module
if (import.meta.main) {
  await main();
}
