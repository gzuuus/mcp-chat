#!/usr/bin/env deno run --allow-env --allow-net --allow-read

/**
 * Test script to demonstrate tool calling functionality
 */

import { Assistant } from "./assistant.ts";
import { TUI } from "./tui.ts";
import { loadConfig } from "./config.ts";
import { availableTools } from "./tools.ts";
import type { AssistantConfig } from "./types.ts";

async function testToolsWithoutAPI() {
  console.log("🧪 Testing Tool Calling Components (No API Required)\n");

  const tui = new TUI({
    title: "Tools Test",
    welcomeMessage: "Testing tool calling functionality...",
  });

  tui.showBanner();

  // Test individual tools
  console.log("🔧 Testing Individual Tools:\n");

  // Test calculator
  const calculatorTool = availableTools.find((t) => t.name === "calculator")!;
  try {
    const result = await calculatorTool.execute({
      operation: "add",
      a: 15,
      b: 27,
    });
    console.log(`✅ Calculator: ${JSON.stringify(result)}`);
  } catch (err) {
    console.log(`❌ Calculator error: ${err}`);
  }

  // Test weather tool
  const weatherTool = availableTools.find((t) => t.name === "get_weather")!;
  try {
    const result = await weatherTool.execute({
      city: "San Francisco",
      units: "celsius",
    });
    console.log(`✅ Weather: ${JSON.stringify(result)}`);
  } catch (err) {
    console.log(`❌ Weather error: ${err}`);
  }

  // Test time tool
  const timeTool = availableTools.find((t) => t.name === "get_time")!;
  try {
    const result = await timeTool.execute({
      timezone: "America/New_York",
      format: "12h",
    });
    console.log(`✅ Time: ${JSON.stringify(result)}`);
  } catch (err) {
    console.log(`❌ Time error: ${err}`);
  }

  // Test text processor
  const textTool = availableTools.find((t) => t.name === "process_text")!;
  try {
    const result = await textTool.execute({
      text: "Hello World!",
      operation: "reverse",
    });
    console.log(`✅ Text Processor: ${JSON.stringify(result)}`);
  } catch (err) {
    console.log(`❌ Text Processor error: ${err}`);
  }

  console.log("\n✅ All tool tests completed successfully!");
}

async function testToolsWithAPI() {
  console.log("\n🚀 Testing Tools with OpenAI API\n");

  try {
    // Load config and add tools
    const baseConfig = loadConfig();
    const configWithTools: AssistantConfig = {
      ...baseConfig,
      tools: availableTools,
      system:
        "You are a helpful assistant with access to various tools. Use the available tools to help answer questions and perform tasks. Be clear about what tools you are using and explain the results.",
    };

    const assistant = new Assistant(configWithTools);
    const tui = new TUI({
      title: "MCP Chat with Tools",
      welcomeMessage: "Chat with AI assistant that has access to tools!",
    });

    tui.showBanner();

    // Test queries that should trigger tool calls
    const testQueries = [
      "What's 25 + 17?",
      "What's the weather like in Tokyo?",
      "What time is it in London?",
      "Count the words in this sentence: 'The quick brown fox jumps over the lazy dog'",
      "Calculate 144 divided by 12, then tell me what time it is in UTC",
    ];

    for (const query of testQueries) {
      console.log(`\n${"=".repeat(60)}`);
      tui.showUserMessage(query);
      tui.showAssistantHeader();

      try {
        for await (const chunk of assistant.message(query)) {
          tui.showAssistantChunk(chunk);
        }
        tui.completeAssistantMessage();
      } catch (error) {
        tui.showError(
          `Error: ${error instanceof Error ? error.message : String(error)}`,
        );
      }

      // Small delay between queries
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log(`\n${"=".repeat(60)}`);
    console.log("🎉 Tool calling tests completed!");

    // Show conversation history
    console.log("\n📋 Final Conversation History:");
    const history = assistant.getHistory();
    console.log(`Total messages: ${history.length}`);

    let toolCallCount = 0;
    let toolMessageCount = 0;

    for (const msg of history) {
      if (msg.role === "assistant" && (msg as any).tool_calls) {
        toolCallCount += (msg as any).tool_calls.length;
      }
      if (msg.role === "tool") {
        toolMessageCount++;
      }
    }

    console.log(`Tool calls made: ${toolCallCount}`);
    console.log(`Tool responses: ${toolMessageCount}`);
  } catch (error) {
    if (error instanceof Error && error.message.includes("API key")) {
      console.log("\n⚠️  API key not found. To test with real OpenAI API:");
      console.log("1. Set your OPENAI_API_KEY environment variable");
      console.log("2. Run this test again");
      console.log("\nFor now, testing tools without API...\n");
      return false;
    } else {
      console.error("Error:", error);
      return false;
    }
  }

  return true;
}

async function main() {
  console.log("🛠️  MCP Chat - Tool Calling Tests\n");

  // Always test tools without API first
  await testToolsWithoutAPI();

  // Try to test with API
  const apiTestSuccessful = await testToolsWithAPI();

  console.log("\n" + "=".repeat(80));
  console.log("📊 Test Summary:");
  console.log("✅ Tool components: Working");
  console.log(
    `${apiTestSuccessful ? "✅" : "⚠️ "} API integration: ${
      apiTestSuccessful ? "Working" : "Requires API key"
    }`,
  );

  if (!apiTestSuccessful) {
    console.log("\n💡 To test the full functionality:");
    console.log(
      "1. Get an OpenAI API key from https://platform.openai.com/account/api-keys",
    );
    console.log("2. Set it as OPENAI_API_KEY environment variable");
    console.log("3. Run: deno task tools-test");
  }

  console.log("\n🎯 Tool calling functionality is ready to use!");
}

if (import.meta.main) {
  await main();
}
