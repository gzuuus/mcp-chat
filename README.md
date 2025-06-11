# MCP Chat

A simple AI LLM chat TUI (Text User Interface) built with Deno and TypeScript.
This application provides a conversational interface to interact with Large
Language Models using the OpenAI API.

## Features

- 🤖 **Conversational AI**: Interactive chat with OpenAI's language models
- 📚 **Conversation Memory**: Maintains conversation history for context
- 🔄 **Streaming Responses**: Real-time streaming of AI responses
- 🛠️ **Tool Calling**: AI can use tools to perform calculations, get weather, time, etc.
- 🎨 **Text User Interface**: Clean, simple terminal-based interface
- ⚙️ **Configurable**: Support for different models and API endpoints
- 🛠️ **Built-in Commands**: Helpful commands for managing conversations

## Prerequisites

- [Deno](https://deno.land/) v1.28.0 or higher
- OpenAI API key

## Installation

1. Clone or download this project
2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
3. Edit `.env` and add your OpenAI API key:
   ```bash
   OPENAI_API_KEY=your_actual_api_key_here
   ```

## Usage

### Basic Usage

Run the application with:

```bash
deno run --allow-env --allow-net --allow-read main.ts
```

Or use the predefined task:

```bash
deno task dev
```

### Environment Variables

| Variable                         | Description                        | Required | Default         |
| -------------------------------- | ---------------------------------- | -------- | --------------- |
| `OPENAI_API_KEY` or `OPENAI_KEY` | Your OpenAI API key                | Yes      | -               |
| `OPENAI_BASE_URL`                | API base URL (for compatible APIs) | No       | OpenAI default  |
| `MODEL_ID`                       | Model to use                       | No       | `gpt-3.5-turbo` |

### Available Commands

While chatting, you can use these commands:

- `/help` - Show available commands
- `/clear` - Clear the screen
- `/history` - Show conversation history
- `/reset` - Reset conversation (clear history)
- `/quit` or `/exit` - Exit the application

### Tool Calling

The assistant comes with built-in tools that can be automatically invoked during conversations:

#### Available Tools

1. **Calculator** - Perform arithmetic operations (add, subtract, multiply, divide)
2. **Weather** - Get mock weather information for major cities
3. **Time** - Get current time in different timezones
4. **Text Processor** - Process text (count words/chars, reverse, case conversion)

#### Testing Tools

Test the tool functionality:

```bash
deno task tools-test
```

This will test all tools individually and demonstrate tool calling in conversations.

#### Using Tools in Chat

Simply ask the AI assistant to perform tasks that require tools:

- "What's 25 + 17?"
- "What's the weather like in Tokyo?"
- "What time is it in London?"
- "Count the words in this sentence"
- "Calculate 144 divided by 12"

#### Creating Custom Tools

You can easily add custom tools by implementing the `AssistantTool` interface:

```typescript
import type { AssistantTool } from './types.ts';

const myCustomTool: AssistantTool = {
  name: 'my_tool',
  description: 'Description of what the tool does',
  parameters: {
    type: 'object',
    properties: {
      input: {
        type: 'string',
        description: 'Input parameter description'
      }
    },
    required: ['input']
  },
  execute: async (args: { input: string }) => {
    // Your tool logic here
    return { result: `Processed: ${args.input}` };
  }
};
```

Then add it to your assistant configuration:

```typescript
const config: AssistantConfig = {
  apiKey: 'your-api-key',
  model: 'gpt-4',
  tools: [myCustomTool, ...availableTools]
};
```

## Project Structure

```
mcp-chat/
├── main.ts          # Main application entry point
├── assistant.ts     # Assistant class for managing conversations
├── tui.ts          # Text User Interface utilities
├── config.ts       # Configuration loading and validation
├── types.ts        # TypeScript type definitions
├── .env.example    # Example environment configuration
├── deno.json       # Deno configuration
└── README.md       # This file
```

## Architecture

### Core Components

1. **Assistant Class** (`assistant.ts`)
   - Manages conversation history
   - Handles OpenAI API communication
   - Provides streaming response generation

2. **TUI Class** (`tui.ts`)
   - Handles terminal input/output
   - Provides user interface elements
   - Manages display formatting

3. **Configuration** (`config.ts`)
   - Loads environment variables
   - Validates configuration
   - Provides default values

### Key Features

- **Stateful Conversations**: Each request includes the full conversation
  history to maintain context
- **Streaming Responses**: Uses OpenAI's streaming API for real-time response
  display
- **Error Handling**: Comprehensive error handling for API failures and user
  input
- **Clean Architecture**: Separation of concerns with dedicated classes for
  different responsibilities

## Example Usage

```typescript
import { Assistant } from "./assistant.ts";
import { loadConfig } from "./config.ts";

// Load configuration
const config = loadConfig();

// Create assistant instance
const assistant = new Assistant(config);

// Send a message and stream the response
for await (const chunk of assistant.message("Hello, how are you?")) {
  console.log(chunk);
}
```

## Compatible APIs

This application works with any OpenAI-compatible API. Simply set the
`OPENAI_BASE_URL` environment variable to point to your preferred endpoint.

## Development

The project uses idiomatic TypeScript and follows these principles:

- **Type Safety**: Comprehensive TypeScript types for all data structures
- **Async/Await**: Modern asynchronous programming patterns
- **Generator Functions**: Efficient streaming using async generators
- **Error Handling**: Proper error handling throughout the application
- **Clean Code**: Well-structured, readable, and maintainable code

## License

This project is open source and available under the MIT License.
