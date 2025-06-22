/**
 * Core message types for the chat application
 */

export type MessageRole = "system" | "user" | "assistant" | "tool";

export interface CoreMessage {
  role: MessageRole;
  content: string;
  tool_call_id?: string;
  name?: string;
  tool_calls?: ToolCall[];
}

export interface UserMessage extends CoreMessage {
  role: "user";
}

export interface AssistantMessage extends CoreMessage {
  role: "assistant";
}

export interface SystemMessage extends CoreMessage {
  role: "system";
}

export interface ToolMessage extends CoreMessage {
  role: "tool";
  tool_call_id: string;
  name: string;
}

export interface AssistantConfig {
  /** OpenAI API configuration */
  apiKey: string;
  baseURL?: string;
  /** Language model to use */
  model: string;
  /** System prompt to set the assistant's behavior */
  system?: string;
  /** MCP configuration */
  mcpEnabled?: boolean;
  mcpConfigPath?: string;
}

/**
 * Tool definition for the assistant
 */
export interface AssistantTool {
  /** Tool name */
  name: string;
  /** Tool description */
  description: string;
  /** Tool parameters schema */
  parameters: Record<string, unknown>;
  /** Tool execution function */
  execute: (args: unknown) => Promise<unknown> | unknown;
}

/**
 * Tool call information from OpenAI
 */
export interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

/**
 * Tool execution result
 */
export interface ToolResult {
  tool_call_id: string;
  name: string;
  content: string;
}

export interface TUIOptions {
  /** Application title */
  title?: string;
  /** Welcome message */
  welcomeMessage?: string;
}
