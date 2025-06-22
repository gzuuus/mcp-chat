import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Create an MCP server with elicitation capabilities
const server = new McpServer({
  name: "Test Elicitation Server",
  version: "1.0.0",
});

// Add a userInfo tool with elicitation (similar to the demo)
server.tool(
  "userInfo",
  {
    name: z.string().optional(),
    age: z.number().optional(),
  },
  async (inputs: { name?: string; age?: number }) => {
    let { name, age } = inputs;

    if (name === undefined) {
      const nameElicitation = await server.server.elicitInput({
        message: "Please provide your name to continue.",
        requestedSchema: {
          type: "object",
          properties: {
            name: { type: "string", title: "Name" },
          },
          required: ["name"],
        },
      });

      if (
        nameElicitation.action === "accept" &&
        typeof nameElicitation.content?.name === "string"
      ) {
        name = nameElicitation.content.name;
      } else {
        return {
          content: [
            { type: "text", text: "Name was not provided. Cannot proceed." },
          ],
        };
      }
    }

    if (age === undefined) {
      const ageElicitation = await server.server.elicitInput({
        message: "Please provide your age to continue.",
        requestedSchema: {
          type: "object",
          properties: {
            age: { type: "number", title: "Age" },
          },
          required: ["age"],
        },
      });

      if (
        ageElicitation.action === "accept" &&
        typeof ageElicitation.content?.age === "number"
      ) {
        age = ageElicitation.content.age;
      } else {
        return {
          content: [
            { type: "text", text: "Age was not provided. Cannot proceed." },
          ],
        };
      }
    }

    return {
      content: [
        {
          type: "text",
          text:
            `User info collected successfully: Name - ${name}, Age - ${age}. This information was obtained through elicitation!`,
        },
      ],
    };
  },
);

// Start the server
const transport = new StdioServerTransport();
await server.connect(transport);
