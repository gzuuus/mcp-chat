# MCP Chat

A simple AI LLM chat TUI (Text User Interface) built with Deno and TypeScript.
This application provides a conversational interface to interact with Large
Language Models using the OpenAI API, with support for Model Context Protocol
(MCP) servers.

> **Note**: This project is in early stages of development. Some models might
> produce different tool call objects which might be unhandled. So far it's
> working well with any GPT model. We've tested without issues with GPT-4.1
> family (normal, nano, micro).

## Features

- 🤖 **Conversational AI**: Interactive chat with OpenAI's language models
- 📚 **Conversation Memory**: Maintains conversation history for context
- 🔄 **Streaming Responses**: Real-time streaming of AI responses
- 🔌 **MCP Integration**: Connect to Model Context Protocol servers for extended
  functionality
- 📝 **Interactive Elicitation**: Tools can request additional information from
  users dynamically
- 🎨 **Clean TUI**: Simple, focused terminal-based interface
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

### Running the Application

By default, MCP support is enabled:

```bash
deno task dev
```

To run without MCP support:

```bash
deno task dev --no-mcp
```

### MCP Server Configuration

Configure MCP servers in `mcp-servers.json` (see `mcp-servers.example.json` for
reference).

### Interactive Elicitation

When MCP tools need additional information, they can request it interactively:

```
📝 Server requesting information:
💡 Type '/cancel' to cancel

Name *:
```

- Required fields are marked with `*`
- Press Enter to skip optional fields
- Type `/cancel` to cancel the request

For detailed information about the elicitation feature, see
[ELICITATION_GUIDE.md](ELICITATION_GUIDE.md).

### Environment Variables

| Variable                         | Description                        | Required | Default         |
| -------------------------------- | ---------------------------------- | -------- | --------------- |
| `OPENAI_API_KEY` or `OPENAI_KEY` | Your OpenAI API key                | Yes      | -               |
| `OPENAI_BASE_URL`                | API base URL (for compatible APIs) | No       | OpenAI default  |
| `MODEL_ID`                       | Model to use                       | No       | `gpt-3.5-turbo` |

### Available Commands

While chatting, you can use these commands:

**Basic Commands:**

- `/help` - Show available commands
- `/clear` - Clear the screen
- `/history` - Show conversation history
- `/reset` - Reset conversation (clear history)
- `/quit` or `/exit` - Exit the application

**MCP Commands** (when MCP is enabled):

- `/mcp` - Show MCP status and information
- `/servers` - Show detailed server information

## License

This project is open source and available under the MIT License.
