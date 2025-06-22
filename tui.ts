import type { CoreMessage, TUIOptions } from "./types.ts";
import * as readline from "node:readline";
import { stdin, stdout } from "node:process";

export class TUI {
  private options: TUIOptions;
  private rl: readline.Interface;

  constructor(options: TUIOptions = {}) {
    this.options = {
      title: "MCP Chat",
      welcomeMessage:
        'Welcome to MCP Chat! Type your message and press Enter. Type "/quit" to exit.',
      ...options,
    };

    this.rl = readline.createInterface({
      input: stdin,
      output: stdout,
    });
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
  getUserInput(): Promise<string> {
    const promptText = "\n> ";
    return new Promise((resolve) => {
      this.rl.question(promptText, (answer) => {
        resolve(answer.trim());
      });
    });
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
   * Returns null if user cancels, otherwise returns the collected data
   */
  async getElicitationInput(
    properties: Record<
      string,
      { type: string; title?: string; [key: string]: unknown }
    >,
    required?: string[],
  ): Promise<Record<string, string | number | undefined> | null> {
    const result: Record<string, string | number | undefined> = {};
    const actualRequired = required || [];

    // Show helpful instructions
    const hasOptionalFields = Object.keys(properties).some((key) =>
      !actualRequired.includes(key)
    );
    console.log("📝 Server requesting information:");
    if (hasOptionalFields) {
      console.log(
        "💡 Press Enter to skip optional fields, or type '/cancel' to cancel\n",
      );
    } else {
      console.log("💡 Type '/cancel' to cancel\n");
    }

    for (const [fieldName, fieldDef] of Object.entries(properties)) {
      const isRequired = actualRequired.includes(fieldName);
      const fieldTitle = fieldDef.title || fieldName;
      const fieldType = fieldDef.type;

      while (true) {
        const promptText = `${fieldTitle}${isRequired ? " *" : ""}: `;
        const input = (await new Promise<string>((resolve) => {
          this.rl.question(promptText, (answer) => {
            resolve(answer);
          });
        })).trim();

        // Handle cancel command
        if (input.toLowerCase() === "/cancel") {
          console.log("❌ Cancelled");
          return null;
        }

        // Handle empty input
        if (!input) {
          if (isRequired) {
            console.log(`❌ Required field`);
            continue;
          } else {
            // Skip optional field - don't add to result
            break;
          }
        }

        // Type conversion
        if (fieldType === "number") {
          const numValue = Number(input);
          if (isNaN(numValue)) {
            console.log(`❌ Must be a number`);
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
}
