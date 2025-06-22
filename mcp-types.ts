/**
 * MCP (Model Context Protocol) type definitions
 */

import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type {
  ElicitRequest,
  ElicitResult,
  Tool,
} from "@modelcontextprotocol/sdk/types";
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

/**
 * ClientResult representing the output of an MCP tool call or resource access.
 * This type is a simplification based on typical SDK outputs.
 */
export interface ClientResult {
  content?: Array<{ type: string; text?: string; [key: string]: unknown }>;
  roots?: Array<{ uri: string; name?: string; [key: string]: unknown }>;
  [key: string]: unknown; // Allow arbitrary properties
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
      { type: string; title?: string; [key: string]: unknown }
    >;
    required?: string[];
  };
}

// /**
//  * Elicitation Handler Request
//  */
// export interface ElicitHandlerRequest {
//   params: ElicitRequestParams;
//   [key: string]: unknown;
// }

// /**
//  * Elicitation Handler Response
//  */
// export interface ElicitHandlerResponse {
//   action: "accept" | "decline" | "cancel";
//   content?: Record<string, string | number | undefined>;
//   roots: Array<{ uri: string; name?: string }>; // roots must be non-optional
//   [key: string]: unknown; // Allow arbitrary properties

// }

/**
 * Elicitation Handler Function Type
 */
export type ElicitationHandler = (
  request: ElicitRequest,
) => Promise<ElicitResult>;
