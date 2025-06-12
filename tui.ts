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

  /**
   * Show elicitation request to user
   */
  showElicitationRequest(message: string): void {
    console.log(`\n❓ ${message}`);
  }

  /**
   * Get elicitation input from user with field prompts
   */
  async getElicitationInput(
    properties: Record<string, { type: string; title: string; [key: string]: unknown }>,
    required: string[]
  ): Promise<Record<string, string | number | undefined>> {
    const result: Record<string, string | number | undefined> = {};
    
    console.log("\nPlease provide the following information:");
    
    for (const [fieldName, fieldDef] of Object.entries(properties)) {
      const isRequired = required.includes(fieldName);
      const fieldTitle = fieldDef.title || fieldName;
      const fieldType = fieldDef.type;
      
      while (true) {
        const prompt = `${fieldTitle}${isRequired ? ' (required)' : ' (optional)'}: `;
        Deno.stdout.writeSync(new TextEncoder().encode(prompt));
        
        const decoder = new TextDecoder();
        const buffer = new Uint8Array(1024);
        const bytesRead = await Deno.stdin.read(buffer);
        
        if (bytesRead === null) {
          throw new Error("EOF received during elicitation");
        }
        
        const input = decoder.decode(buffer.subarray(0, bytesRead)).trim();
        
        // Handle empty input
        if (!input) {
          if (isRequired) {
            console.log(`❌ ${fieldTitle} is required. Please provide a value.`);
            continue;
          } else {
            break; // Skip optional field
          }
        }
        
        // Type conversion
        if (fieldType === "number") {
          const numValue = Number(input);
          if (isNaN(numValue)) {
            console.log(`❌ ${fieldTitle} must be a number. Please try again.`);
            continue;
          }
          result[fieldName] = numValue;
        } else {
          result[fieldName] = input;
        }
        
        break;
      }
    }
    
    return result;
  }

  /**
   * Ask user whether to accept, decline, or cancel elicitation
   */
  async confirmElicitation(): Promise<"accept" | "decline" | "cancel"> {
    while (true) {
      console.log("\nWhat would you like to do?");
      console.log("  [a] Accept and provide the information");
      console.log("  [d] Decline to provide information");
      console.log("  [c] Cancel the operation");
      
      Deno.stdout.writeSync(new TextEncoder().encode("\nChoice (a/d/c): "));
      
      const decoder = new TextDecoder();
      const buffer = new Uint8Array(1024);
      const bytesRead = await Deno.stdin.read(buffer);
      
      if (bytesRead === null) {
        return "cancel";
      }
      
      const choice = decoder.decode(buffer.subarray(0, bytesRead)).trim().toLowerCase();
      
      switch (choice) {
        case "a":
        case "accept":
          return "accept";
        case "d":
        case "decline":
          return "decline";
        case "c":
        case "cancel":
          return "cancel";
        default:
          console.log("❌ Invalid choice. Please enter 'a', 'd', or 'c'.");
      }
    }
  }
}
