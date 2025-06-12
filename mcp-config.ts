import type { McpJson } from "./mcp-types.ts";

/**
 * Load MCP server configuration from mcp-servers.json file
 * @returns Promise resolving to MCP configuration object
 */
export async function loadMCPConfig(): Promise<McpJson> {
  try {
    const configText = await Deno.readTextFile("mcp-servers.json");
    const config = JSON.parse(configText) as McpJson;
    return config;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      // Return empty configuration if file doesn't exist
      console.warn("mcp-servers.json not found, using empty MCP configuration");
      return {
        servers: {},
      };
    }
    throw new Error(
      `Failed to load MCP configuration: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}
