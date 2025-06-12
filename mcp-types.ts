/**
 * MCP (Model Context Protocol) type definitions
 */

import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";

/**
 * MCP server configuration structure from mcp-servers.json
 */
export interface McpJson {
  servers: {
    [name: string]: {
      type: "stdio";
      command: string;
      args: string[];
    };
  };
}

/**
 * Runtime MCP server connection information
 */
export interface MCPServerConnection {
  /** Server name from configuration */
  name: string;
  /** MCP client instance */
  client: Client;
  /** Transport layer for communication */
  transport: StdioClientTransport;
  /** Connection status */
  connected: boolean;
  /** Available tools from this server */
  tools: Tool[];
}
