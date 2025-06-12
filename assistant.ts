import OpenAI from "@openai/openai";
import type {
  AssistantConfig,
  AssistantTool,
  CoreMessage,
  ToolCall,
  UserMessage,
} from "./types.ts";
import { MCPClientManager } from "./mcp-client.ts";
import type { ElicitHandlerRequest, ElicitHandlerResponse } from "./mcp-types.ts";

export class Assistant {
  /** Message history */
  readonly messages: CoreMessage[] = [];

  /** Configuration for the assistant */
  protected config: AssistantConfig;

  /** OpenAI client instance */
  private client: OpenAI;

  /** Available tools */
  private tools: Map<string, AssistantTool> = new Map();

  /** MCP client manager */
  private mcpClient?: MCPClientManager;

  /** Elicitation handler callback */
  private elicitationHandler?: (request: ElicitHandlerRequest) => Promise<ElicitHandlerResponse>;

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

    // Initialize MCP client if enabled
    if (config.mcpEnabled) {
      this.mcpClient = new MCPClientManager();
    }
  }

  /**
   * Set the elicitation handler for MCP tools
   */
  setElicitationHandler(handler: (request: ElicitHandlerRequest) => Promise<ElicitHandlerResponse>): void {
    this.elicitationHandler = handler;
    if (this.mcpClient) {
      this.mcpClient.setElicitationHandler(handler);
    }
  }

  /**
   * Initialize MCP client and load tools
   */
  async initializeMCP(): Promise<void> {
    if (!this.mcpClient) {
      return;
    }

    try {
      // Set elicitation handler if available
      if (this.elicitationHandler) {
        this.mcpClient.setElicitationHandler(this.elicitationHandler);
      }

      await this.mcpClient.initialize();

      // Load MCP tools and add them to the tools map
      const mcpTools = this.mcpClient.getAssistantTools();
      for (const tool of mcpTools) {
        this.tools.set(tool.name, tool);
      }

      console.log(`Loaded ${mcpTools.length} MCP tools`);
    } catch (error) {
      console.error("Failed to initialize MCP:", error);
      throw error;
    }
  }

  /**
   * Get all available tools (regular + MCP)
   */
  private getAllTools(): AssistantTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get MCP server information
   */
  getMCPServerInfo() {
    return this.mcpClient?.getServerInfo() ?? [];
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
      let toolCalls: ToolCall[] = [];

      try {
        // Prepare messages for API call
        const apiMessages = this.messages.map((msg) => {
          const baseMessage: Record<string, any> = {
            role: msg.role,
            content: msg.content,
          };

          // Add tool-specific fields if it's a tool message
          if (msg.role === "tool" && msg.tool_call_id && msg.name) {
            baseMessage.tool_call_id = msg.tool_call_id;
            baseMessage.name = msg.name;
          }

          // Add tool_calls for assistant messages
          if (msg.role === "assistant" && msg.tool_calls) {
            baseMessage.tool_calls = msg.tool_calls;
          }

          return baseMessage;
        });

        // Create streaming completion
        const stream = await this.client.chat.completions.create({
          model: this.config.model,
          messages: apiMessages as any,
          stream: true,
          ...(this.tools.size > 0 && {
            tools: this.getAllTools().map((tool) => ({
              type: "function" as const,
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
                  id: "",
                  type: "function",
                  function: { name: "", arguments: "" },
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
                toolCalls[index].function.arguments +=
                  toolCallDelta.function.arguments;
              }
            }
          }
        }

        // Create assistant message with tool calls if any
        const assistantMessage: CoreMessage = {
          role: "assistant",
          content: assistantResponse || "",
          ...(toolCalls.length > 0 && { tool_calls: toolCalls }),
        };

        this.messages.push(assistantMessage);

        // If no tool calls, we're done
        if (toolCalls.length === 0) {
          break;
        }

        // Execute tool calls
        yield `\n🔧 Executing ${toolCalls.length} tool call${
          toolCalls.length > 1 ? "s" : ""
        }...\n`;

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

            yield `✅ ${toolCall.function.name}: ${
              JSON.stringify(result).substring(0, 100)
            }${JSON.stringify(result).length > 100 ? "..." : ""}\n`;
          } catch (error) {
            const errorResult = `Error executing ${toolCall.function.name}: ${
              error instanceof Error ? error.message : "Unknown error"
            }`;

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

        // Continue the loop to make another API call with tool results
        // Reset for next iteration
        toolCalls = [];
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
   * Cleanup resources (disconnect MCP clients)
   */
  async cleanup(): Promise<void> {
    if (this.mcpClient) {
      await this.mcpClient.shutdown();
    }
  }

  /**
   * Check if MCP is enabled and initialized
   */
  isMCPEnabled(): boolean {
    return this.mcpClient?.isInitialized() ?? false;
  }

  /**
   * Get the number of connected MCP servers
   */
  getMCPServerCount(): number {
    return this.mcpClient?.getConnectedServerCount() ?? 0;
  }
}
