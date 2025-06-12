# Elicitation Feature Guide

## Overview

The elicitation feature allows MCP tools to dynamically request additional information from users during tool execution. This is an experimental feature from the MCP TypeScript SDK that enables interactive workflows.

## How It Works

1. **Tool Execution**: When a tool needs additional information, it calls `server.server.elicitInput()`
2. **User Prompt**: The chat application presents the request to the user via the TUI
3. **User Input**: The user can choose to accept, decline, or cancel the request
4. **Information Collection**: If accepted, the user provides the requested data through interactive prompts
5. **Continuation**: The tool continues execution with the provided information

## Implementation Details

### Key Components Updated

1. **MCP Client** (`mcp-client.ts`):
   - Added elicitation handler support
   - Updated to use experimental MCP SDK
   - Added capabilities for elicitation

2. **TUI Interface** (`tui.ts`):
   - Added `showElicitationRequest()` method
   - Added `getElicitationInput()` for field collection
   - Added `confirmElicitation()` for user confirmation

3. **Assistant** (`assistant.ts`):
   - Added elicitation handler management
   - Integrated with MCP client initialization

4. **Main Application** (`main.ts`):
   - Wired up elicitation handler between TUI and Assistant
   - Handles the flow from request to user input to response

### Configuration Changes

- **deno.json**: Updated to use experimental MCP SDK and added `--unstable-node-globals` flag
- **MCP Servers**: Can now include servers that use elicitation

## Example Usage

### Test Server

The included `test-elicitation-server.ts` demonstrates a `userInfo` tool that:
1. Requests the user's name if not provided
2. Requests the user's age if not provided
3. Returns formatted information

### User Experience

When a tool requires elicitation:

```
❓ Please provide your name to continue.

What would you like to do?
  [a] Accept and provide the information
  [d] Decline to provide information
  [c] Cancel the operation

Choice (a/d/c): a

Please provide the following information:
Name (required): John Doe
```

## Technical Details

### Types

- `ElicitRequestParams`: Defines the elicitation request structure
- `ElicitHandlerRequest`: Request object passed to handlers
- `ElicitHandlerResponse`: Response format for elicitation
- `ElicitationHandler`: Function type for handling requests

### Schema Format

Elicitation requests use JSON Schema format:

```typescript
{
  type: "object",
  properties: {
    fieldName: { 
      type: "string|number", 
      title: "Display Name" 
    }
  },
  required: ["fieldName"]
}
```

## Running with Elicitation

1. Ensure you have the experimental MCP SDK built and available
2. Run the application: `deno task dev`
3. The application will automatically connect to MCP servers
4. Use tools that require elicitation - the UI will guide you through the process

## Benefits

- **Interactive Tools**: Tools can gather information dynamically
- **Better UX**: Users provide only the information needed, when needed
- **Flexible Workflows**: Tools can adapt based on available information
- **Privacy Aware**: Users can decline to provide sensitive information

This feature enables more sophisticated and user-friendly MCP tools that can interact naturally with users when additional information is required.