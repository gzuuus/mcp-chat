import OpenAI from "@openai/openai";
import type {
  AssistantConfig,
  AssistantMessage,
  CoreMessage,
  UserMessage,
  AssistantTool,
  ToolResult,
} from "./types.ts";

export class Assistant {
  /** Message history */
  readonly messages: CoreMessage[] = [];

  /** Configuration for the assistant */
  protected config: AssistantConfig;

  /** OpenAI client instance */
  private client: OpenAI;

  /** Available tools */
  private tools: Map<string, AssistantTool> = new Map();

  constructor(config: AssistantConfig) {
    this.config = config;
    this.client = new OpenAI({
      apiKey: config.apiKey,
      ...(config.baseURL && { baseURL: config.baseURL }),
    });

    // Add system message if provided
    if (config.system) {
      this.messages.push({
        role: "system",
        content: config.system,
      });
    }

    // Initialize tools
    if (config.tools) {
      for (const tool of config.tools) {
        this.tools.set(tool.name, tool);
      }
    }
  }

  /**
   * Send a user message to the assistant and get streaming response
   */
  async *message(content: string): AsyncGenerator<string> {
    // Add user message to history
    const userMessage: UserMessage = { role: "user", content };
    this.messages.push(userMessage);

    // Continue conversation until no more tool calls are needed
    while (true) {
      let assistantResponse = "";
      let toolCalls: any[] = [];
      let currentToolCall: any = null;

      try {
        // Create streaming completion
        const stream = await this.client.chat.completions.create({
          model: this.config.model,
          messages: this.messages.map((msg) => {
            const baseMessage: any = {
              role: msg.role,
              content: msg.content,
            };
            
            // Add tool-specific fields if it's a tool message
            if (msg.role === 'tool' && msg.tool_call_id && msg.name) {
              baseMessage.tool_call_id = msg.tool_call_id;
              baseMessage.name = msg.name;
            }
            
            return baseMessage;
          }),
          stream: true,
          ...(this.config.tools && this.config.tools.length > 0 && {
            tools: this.config.tools.map(tool => ({
              type: 'function' as const,
              function: {
                name: tool.name,
                description: tool.description,
                parameters: tool.parameters,
              },
            })),
          }),
        });

        // Process streaming response
        for await (const chunk of stream) {
          const choice = chunk.choices[0];
          if (!choice) continue;

          const delta = choice.delta;

          // Handle content streaming
          if (delta.content) {
            assistantResponse += delta.content;
            yield delta.content;
          }

          // Handle tool calls
          if (delta.tool_calls) {
            for (const toolCallDelta of delta.tool_calls) {
              const index = toolCallDelta.index!;
              
              // Initialize tool call if needed
              if (!toolCalls[index]) {
                toolCalls[index] = {
                  id: '',
                  type: 'function',
                  function: { name: '', arguments: '' }
                };
              }

              // Update tool call with delta
              if (toolCallDelta.id) {
                toolCalls[index].id = toolCallDelta.id;
              }
              if (toolCallDelta.function?.name) {
                toolCalls[index].function.name += toolCallDelta.function.name;
              }
              if (toolCallDelta.function?.arguments) {
                toolCalls[index].function.arguments += toolCallDelta.function.arguments;
              }
            }
          }
        }

        // Create assistant message with tool calls if any
        const assistantMessage: any = {
          role: "assistant",
          content: assistantResponse || null,
        };

        if (toolCalls.length > 0) {
          assistantMessage.tool_calls = toolCalls;
        }

        this.messages.push(assistantMessage);

        // If no tool calls, we're done
        if (toolCalls.length === 0) {
          break;
        }

        // Execute tool calls
        yield `\n🔧 Executing ${toolCalls.length} tool call${toolCalls.length > 1 ? 's' : ''}...\n`;

        for (const toolCall of toolCalls) {
          try {
            const tool = this.tools.get(toolCall.function.name);
            if (!tool) {
              throw new Error(`Tool '${toolCall.function.name}' not found`);
            }

            const args = JSON.parse(toolCall.function.arguments);
            const result = await tool.execute(args);

            // Add tool result to messages
            this.messages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              name: toolCall.function.name,
              content: JSON.stringify(result),
            });

            yield `✅ ${toolCall.function.name}: ${JSON.stringify(result).substring(0, 100)}${JSON.stringify(result).length > 100 ? '...' : ''}\n`;

          } catch (error) {
            const errorResult = `Error executing ${toolCall.function.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
            
            this.messages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              name: toolCall.function.name,
              content: errorResult,
            });

            yield `❌ ${errorResult}\n`;
          }
        }

        yield `\n🤖 Processing results...\n`;

      } catch (error) {
        const errorMessage = `Error: ${
          error instanceof Error ? error.message : "Unknown error occurred"
        }`;
        yield errorMessage;

        // Add error message to history
        this.messages.push({
          role: "assistant",
          content: errorMessage,
        });
        break;
      }
    }
  }

  /**
   * Get the conversation history
   */
  getHistory(): CoreMessage[] {
    return [...this.messages];
  }

  /**
   * Clear the conversation history (keeping system message if any)
   */
  clearHistory(): void {
    const systemMessage = this.messages.find((msg) => msg.role === "system");
    this.messages.length = 0;
    if (systemMessage) {
      this.messages.push(systemMessage);
    }
  }

  /**
   * Get the last message in the history, if any
   */
  private get lastMessage(): CoreMessage | undefined {
    return this.messages[this.messages.length - 1];
  }
}
