/**
 * MCP (Model Context Protocol) type definitions
 */

import type { Client } from "@mcp/sdk/client/index.js";
import type { StdioClientTransport } from "@mcp/sdk/client/stdio.js";

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
 * MCP Tool definition
 */
export interface MCPTool {
  name: string;
  description?: string;
  inputSchema?: any;
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
  tools: MCPTool[];
}

/**
 * Elicitation Request Parameters
 */
export interface ElicitRequestParams {
  message: string;
  requestedSchema: {
    type: "object";
    properties: Record<
      string,
      { type: string; title: string; [key: string]: unknown }
    >;
    required: string[];
  };
}

/**
 * Elicitation Handler Request
 */
export interface ElicitHandlerRequest {
  params: ElicitRequestParams;
  [key: string]: unknown;
}

/**
 * Elicitation Handler Response
 */
export interface ElicitHandlerResponse {
  action: "accept" | "decline" | "cancel";
  content?: Record<string, string | number | undefined>;
}

/**
 * Elicitation Handler Function Type
 */
export type ElicitationHandler = (
  request: ElicitHandlerRequest,
) => Promise<ElicitHandlerResponse>;
