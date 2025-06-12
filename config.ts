import type { AssistantConfig } from "./types.ts";

/**
 * Load configuration from environment variables
 */
export function loadConfig(): AssistantConfig {
  const apiKey = Deno.env.get("OPENAI_API_KEY") || Deno.env.get("OPENAI_KEY");
  const baseURL = Deno.env.get("OPENAI_BASE_URL");
  const model = Deno.env.get("MODEL_ID") || "gpt-3.5-turbo";

  // MCP configuration
  const mcpEnabled = Deno.env.get("MCP_ENABLED") === "true";
  const mcpConfigPath = Deno.env.get("MCP_CONFIG_PATH") || "./mcp-servers.json";

  if (!apiKey) {
    throw new Error(
      "OpenAI API key is required. Please set OPENAI_API_KEY or OPENAI_KEY environment variable.",
    );
  }

  const config: AssistantConfig = {
    apiKey,
    model,
    system:
      "You are a helpful AI assistant. Be concise and helpful in your responses.",
    mcpEnabled,
    mcpConfigPath,
  };

  if (baseURL) {
    config.baseURL = baseURL;
  }

  return config;
}

/**
 * Validate the configuration
 */
export function validateConfig(config: AssistantConfig): void {
  if (!config.apiKey || config.apiKey.trim() === "") {
    throw new Error("API key cannot be empty");
  }

  if (!config.model || config.model.trim() === "") {
    throw new Error("Model ID cannot be empty");
  }

  // Validate base URL format if provided
  if (config.baseURL) {
    try {
      new URL(config.baseURL);
    } catch {
      throw new Error("Invalid base URL format");
    }
  }

  // Validate MCP configuration if enabled
  if (config.mcpEnabled) {
    if (!config.mcpConfigPath || config.mcpConfigPath.trim() === "") {
      throw new Error("MCP config path cannot be empty when MCP is enabled");
    }

    try {
      Deno.statSync(config.mcpConfigPath);
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        console.warn(
          `MCP config file not found at ${config.mcpConfigPath}, will use empty configuration`,
        );
      } else {
        throw error;
      }
    }
  }
}
