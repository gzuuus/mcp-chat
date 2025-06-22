/**
 * MCP (Model Context Protocol) client integration
 * Provides a thin layer between MCP servers and OpenAI API
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { ElicitRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import type {
  CallToolRequest,
  ElicitRequest,
  ElicitResult,
} from "@modelcontextprotocol/sdk/types";

import type {
  ClientResult,
  ElicitationHandler,
  McpJson,
  MCPServerConnection,
} from "./mcp-types.ts";
import type { AssistantTool } from "./types.ts";
import { loadMCPConfig } from "./mcp-config.ts";

/**
 * MCP Client Manager
 * Handles connection to MCP servers and tool transformation
 */
export class MCPClientManager {
  private servers: Map<string, MCPServerConnection> = new Map();
  private initialized = false;
  private elicitationHandler?: ElicitationHandler;

  /**
   * Common error logging utility
   */
  private logError(message: string, error: unknown): void {
    console.error(`${message}:`, error);
  }

  /**
   * Set the elicitation handler for processing user input requests
   */
  setElicitationHandler(handler: ElicitationHandler): void {
    this.elicitationHandler = handler;
  }

  /**
   * Initialize MCP client connections from configuration
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      const config = await loadMCPConfig();

      // Connect to each configured server
      const connectionPromises = Object.entries(config.servers).map(
        async ([serverName, serverConfig]) => {
          try {
            await this.connectToServer(serverName, serverConfig);
          } catch (error) {
            this.logError(
              `Failed to connect to MCP server '${serverName}'`,
              error,
            );
          }
        },
      );

      await Promise.all(connectionPromises);
      this.initialized = true;
    } catch (error) {
      this.logError("Failed to initialize MCP client", error);
      throw error;
    }
  }

  /**
   * Connect to a single MCP server
   */
  private async connectToServer(
    name: string,
    config: McpJson["servers"][string],
  ): Promise<void> {
    if (config.type !== "stdio") {
      throw new Error(`Unsupported transport type: ${config.type}`);
    }

    // Create transport
    const transport = new StdioClientTransport({
      command: config.command,
      args: config.args,
    });

    // Create client with elicitation capabilities
    const client = new Client(
      {
        name: "mcp-chat-client",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
          elicitation: {},
        },
      },
    );

    // Set up elicitation handler if provided
    if (this.elicitationHandler) {
      const handler = this.elicitationHandler;
      client.setRequestHandler(
        ElicitRequestSchema,
        async (request): Promise<ElicitResult> => {
          return await handler(request as ElicitRequest);
        },
      );
    }

    try {
      // Connect to server
      await client.connect(transport);

      // List available tools
      const toolsResult = await client.listTools();

      // Store server connection
      const serverConnection: MCPServerConnection = {
        name,
        client,
        transport,
        connected: true,
        tools: toolsResult.tools || [],
      };

      this.servers.set(name, serverConnection);
    } catch (error) {
      // Clean up on failure
      await client.close().catch((closeError) =>
        this.logError("Error closing failed client connection", closeError)
      );
      throw error;
    }
  }

  /**
   * Get all available tools from all connected servers
   * Transformed to OpenAI-compatible format
   */
  getAssistantTools(): AssistantTool[] {
    const tools: AssistantTool[] = [];

    for (const [serverName, connection] of this.servers) {
      if (!connection.connected) continue;

      const transformedTools = connection.tools.map((mcpTool) => ({
        name: `${serverName}_${mcpTool.name}`,
        description: mcpTool.description ||
          `Tool from MCP server: ${serverName}`,
        parameters: mcpTool.inputSchema || { type: "object", properties: {} },
        execute: (args: CallToolRequest["params"]["arguments"]) =>
          this.executeMCPTool(serverName, mcpTool.name, args),
      }));

      tools.push(...transformedTools);
    }

    return tools;
  }

  /**
   * Execute an MCP tool
   */
  private async executeMCPTool(
    serverName: string,
    toolName: string,
    args: CallToolRequest["params"]["arguments"],
  ): Promise<unknown> {
    const connection = this.servers.get(serverName);
    if (!connection || !connection.connected) {
      throw new Error(`MCP server '${serverName}' is not connected`);
    }

    const baseResult = { server: serverName, tool: toolName };

    try {
      const result = await connection.client.callTool({
        name: toolName,
        arguments: args,
      });

      const content = this.extractTextContent(result) ||
        "Tool executed successfully";
      return { ...baseResult, success: true, content };
    } catch (error) {
      this.logError(
        `Error executing MCP tool ${serverName}:${toolName}`,
        error,
      );
      return {
        ...baseResult,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Extract text content from MCP result
   */
  private extractTextContent(result: ClientResult): string {
    if (!result.content || !Array.isArray(result.content)) {
      return "";
    }

    return result.content
      .filter((content: { type: string; text?: string }) =>
        content.type === "text"
      )
      .map((content: { type: string; text?: string }) => content.text)
      .join("\n");
  }

  /**
   * Get information about connected servers
   */
  getServerInfo(): Array<{
    name: string;
    connected: boolean;
    toolCount: number;
    tools: string[];
  }> {
    return Array.from(this.servers.values()).map((connection) => ({
      name: connection.name,
      connected: connection.connected,
      toolCount: connection.tools.length,
      tools: connection.tools.map((tool) => tool.name),
    }));
  }

  /**
   * Disconnect from all servers and cleanup
   */
  async shutdown(): Promise<void> {
    const disconnectPromises = Array.from(this.servers.values())
      .filter((connection) => connection.connected)
      .map((connection) =>
        connection.client.close().catch((error) =>
          this.logError(
            `Error disconnecting from server ${connection.name}`,
            error,
          )
        )
      );

    await Promise.all(disconnectPromises);
    this.servers.clear();
    this.initialized = false;
  }

  /**
   * Check if MCP client is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get the number of connected servers
   */
  getConnectedServerCount(): number {
    return Array.from(this.servers.values()).filter((conn) => conn.connected)
      .length;
  }
}
