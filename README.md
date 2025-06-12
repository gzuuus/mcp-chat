# MCP Chat

A simple AI LLM chat TUI (Text User Interface) built with Deno and TypeScript.
This application provides a conversational interface to interact with Large
Language Models using the OpenAI API.

## Features

- 🤖 **Conversational AI**: Interactive chat with OpenAI's language models
- 📚 **Conversation Memory**: Maintains conversation history for context
- 🔄 **Streaming Responses**: Real-time streaming of AI responses
- 🛠️ **Tool Calling**: AI can use tools to perform calculations, get weather,
  time, etc.
- 🔌 **MCP Integration**: Connect to Model Context Protocol servers for extended
  functionality
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

### Basic Chat (without tools)

Run the basic chat application:

```bash
deno task dev
```

### MCP Chat (with MCP servers)

Run the chat application with MCP server support:

```bash
deno task dev --mcp
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

## License

This project is open source and available under the MIT License.
