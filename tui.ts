import type { CoreMessage, TUIOptions } from "./types.ts";

export class TUI {
  private options: TUIOptions;

  constructor(options: TUIOptions = {}) {
    this.options = {
      title: "MCP Chat",
      welcomeMessage:
        'Welcome to MCP Chat! Type your message and press Enter. Type "/quit" to exit.',
      ...options,
    };
  }

  /**
   * Display the application banner
   */
  showBanner(): void {
    const title = this.options.title!;
    const border = "=".repeat(title.length + 4);

    console.log("\n" + border);
    console.log(`  ${title}  `);
    console.log(border);

    if (this.options.welcomeMessage) {
      console.log(`\n${this.options.welcomeMessage}\n`);
    }
  }

  /**
   * Display a user message
   */
  showUserMessage(content: string): void {
    console.log(`\n🧑 You: ${content}`);
  }

  /**
   * Display assistant message header
   */
  showAssistantHeader(): void {
    Deno.stdout.writeSync(new TextEncoder().encode(`\n🤖 Assistant: `));
  }

  /**
   * Display assistant message chunk (for streaming)
   */
  showAssistantChunk(chunk: string): void {
    Deno.stdout.writeSync(new TextEncoder().encode(chunk));
  }

  /**
   * Complete the assistant message display
   */
  completeAssistantMessage(): void {
    console.log(); // New line after streaming is complete
  }

  /**
   * Show error message
   */
  showError(error: string): void {
    console.log(`\n❌ ${error}`);
  }

  /**
   * Show info message
   */
  showInfo(info: string): void {
    console.log(`\nℹ️  ${info}`);
  }

  /**
   * Get user input
   */
  async getUserInput(): Promise<string> {
    const decoder = new TextDecoder();
    const buffer = new Uint8Array(1024);

    // Show prompt
    Deno.stdout.writeSync(new TextEncoder().encode("\n> "));

    // Read input
    const bytesRead = await Deno.stdin.read(buffer);
    if (bytesRead === null) {
      return "/quit"; // EOF received
    }

    const input = decoder.decode(buffer.subarray(0, bytesRead)).trim();
    return input;
  }

  /**
   * Clear the screen
   */
  clearScreen(): void {
    console.clear();
  }

  /**
   * Display conversation history
   */
  showHistory(messages: CoreMessage[]): void {
    console.log("\n📋 Conversation History:");
    console.log("━".repeat(50));

    for (const message of messages) {
      if (message.role === "system") {
        console.log(`⚙️  System: ${message.content}`);
      } else if (message.role === "user") {
        console.log(`🧑 You: ${message.content}`);
      } else if (message.role === "assistant") {
        console.log(`🤖 Assistant: ${message.content}`);
      }
      console.log("─".repeat(30));
    }
  }

  /**
   * Show available commands
   */
  showHelp(): void {
    console.log("\n📖 Available Commands:");
    console.log("━".repeat(30));
    console.log("/help     - Show this help message");
    console.log("/clear    - Clear the screen");
    console.log("/history  - Show conversation history");
    console.log("/reset    - Reset conversation");
    console.log("/quit     - Exit the application");
    console.log("━".repeat(30));
  }
}
