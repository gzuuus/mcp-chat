#!/usr/bin/env deno run --allow-env --allow-net --allow-read

/**
 * Example main application with tools enabled
 * This demonstrates how to integrate tools into the MCP Chat application
 */

import { Assistant } from './assistant.ts';
import { TUI } from './tui.ts';
import { loadConfig, validateConfig } from './config.ts';
import { availableTools } from './tools.ts';
import type { AssistantConfig } from './types.ts';

/**
 * Main application class with tools enabled
 */
class MCPChatWithTools {
  private assistant: Assistant;
  private tui: TUI;
  private running = false;

  constructor() {
    this.tui = new TUI({
      title: 'MCP Chat with Tools',
      welcomeMessage: 'Welcome to MCP Chat with Tool Support!\n\n' +
                     '🛠️  Available Tools: Calculator, Weather, Time, Text Processor\n' +
                     'Try asking: "What\'s 25 + 17?" or "What time is it in Tokyo?"\n\n' +
                     'Type "/help" for available commands.',
    });

    // Load and validate configuration
    try {
      const baseConfig = loadConfig();
      validateConfig(baseConfig);
      
      // Add tools to configuration
      const configWithTools: AssistantConfig = {
        ...baseConfig,
        tools: availableTools,
        system: 'You are a helpful AI assistant with access to various tools. ' +
               'Use the available tools when needed to help answer questions and perform tasks. ' +
               'Be clear about what tools you are using and explain the results. ' +
               'If a user asks for calculations, weather, time, or text processing, use the appropriate tools.'
      };

      this.assistant = new Assistant(configWithTools);
      
    } catch (error) {
      this.tui.showError(`Configuration error: ${error instanceof Error ? error.message : String(error)}`);
      this.tui.showInfo('Please check your environment variables:');
      this.tui.showInfo('- OPENAI_API_KEY or OPENAI_KEY (required)');
      this.tui.showInfo('- OPENAI_BASE_URL (optional)');
      this.tui.showInfo('- MODEL_ID (optional, defaults to gpt-3.5-turbo)');
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
        if (input.startsWith('/')) {
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
          this.tui.showInfo('\nGoodbye! 👋');
          break;
        }
        
        this.tui.showError(`An error occurred: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  /**
   * Handle slash commands
   */
  private async handleCommand(command: string): Promise<void> {
    const cmd = command.toLowerCase().trim();

    switch (cmd) {
      case '/quit':
      case '/exit':
        this.tui.showInfo('Goodbye! 👋');
        this.running = false;
        break;

      case '/help':
        this.tui.showHelp();
        this.showToolsHelp();
        break;

      case '/clear':
        this.tui.clearScreen();
        this.tui.showBanner();
        break;

      case '/history':
        this.tui.showHistory(this.assistant.getHistory());
        break;

      case '/reset':
        this.assistant.clearHistory();
        this.tui.showInfo('Conversation history cleared.');
        break;

      case '/tools':
        this.showToolsInfo();
        break;

      default:
        this.tui.showError(`Unknown command: ${command}`);
        this.tui.showInfo('Type "/help" to see available commands.');
        break;
    }
  }

  /**
   * Show tools help
   */
  private showToolsHelp(): void {
    console.log('\n🛠️  Available Tools:');
    console.log('━'.repeat(30));
    console.log('calculator    - Perform arithmetic operations');
    console.log('get_weather   - Get weather information');
    console.log('get_time      - Get current time in timezones');
    console.log('process_text  - Process text (count, reverse, etc.)');
    console.log('━'.repeat(30));
    console.log('\n💡 Example queries:');
    console.log('- "What\'s 25 + 17?"');
    console.log('- "What\'s the weather in Tokyo?"');
    console.log('- "What time is it in London?"');
    console.log('- "Count words in \'Hello World\'"');
  }

  /**
   * Show detailed tools information
   */
  private showToolsInfo(): void {
    console.log('\n🔧 Tool Details:\n');
    
    for (const tool of availableTools) {
      console.log(`📋 ${tool.name}`);
      console.log(`   Description: ${tool.description}`);
      console.log(`   Parameters: ${JSON.stringify(tool.parameters, null, 2)}`);
      console.log();
    }
  }
}

/**
 * Application entry point
 */
async function main(): Promise<void> {
  // Handle Ctrl+C gracefully
  Deno.addSignalListener('SIGINT', () => {
    console.log('\n\nGoodbye! 👋');
    Deno.exit(0);
  });

  const app = new MCPChatWithTools();
  await app.run();
}

// Run the application if this is the main module
if (import.meta.main) {
  await main();
}