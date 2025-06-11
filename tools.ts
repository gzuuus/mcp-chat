import type { AssistantTool } from './types.ts';

/**
 * Example tools for demonstration
 */

/**
 * Calculator tool that can perform basic arithmetic operations
 */
export const calculatorTool: AssistantTool = {
  name: 'calculator',
  description: 'Perform basic arithmetic operations like addition, subtraction, multiplication, and division',
  parameters: {
    type: 'object',
    properties: {
      operation: {
        type: 'string',
        enum: ['add', 'subtract', 'multiply', 'divide'],
        description: 'The arithmetic operation to perform'
      },
      a: {
        type: 'number',
        description: 'First number'
      },
      b: {
        type: 'number',
        description: 'Second number'
      }
    },
    required: ['operation', 'a', 'b']
  },
  execute: async (args: { operation: string; a: number; b: number }) => {
    const { operation, a, b } = args;
    
    switch (operation) {
      case 'add':
        return { result: a + b, calculation: `${a} + ${b} = ${a + b}` };
      case 'subtract':
        return { result: a - b, calculation: `${a} - ${b} = ${a - b}` };
      case 'multiply':
        return { result: a * b, calculation: `${a} × ${b} = ${a * b}` };
      case 'divide':
        if (b === 0) {
          throw new Error('Division by zero is not allowed');
        }
        return { result: a / b, calculation: `${a} ÷ ${b} = ${a / b}` };
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  }
};

/**
 * Weather tool (mock implementation)
 */
export const weatherTool: AssistantTool = {
  name: 'get_weather',
  description: 'Get current weather information for a specific city',
  parameters: {
    type: 'object',
    properties: {
      city: {
        type: 'string',
        description: 'The city name'
      },
      country: {
        type: 'string',
        description: 'The country code (optional)',
        default: 'US'
      },
      units: {
        type: 'string',
        enum: ['celsius', 'fahrenheit'],
        description: 'Temperature units',
        default: 'celsius'
      }
    },
    required: ['city']
  },
  execute: async (args: { city: string; country?: string; units?: string }) => {
    const { city, country = 'US', units = 'celsius' } = args;
    
    // Mock weather data
    const mockWeatherData = {
      'San Francisco': { temp: 18, condition: 'Foggy', humidity: 85 },
      'New York': { temp: 22, condition: 'Sunny', humidity: 60 },
      'London': { temp: 15, condition: 'Rainy', humidity: 90 },
      'Tokyo': { temp: 25, condition: 'Cloudy', humidity: 70 },
      'Sydney': { temp: 20, condition: 'Sunny', humidity: 55 }
    };
    
    const weatherKey = Object.keys(mockWeatherData).find(key => 
      key.toLowerCase().includes(city.toLowerCase())
    );
    
    if (!weatherKey) {
      return {
        city,
        country,
        error: 'Weather data not available for this city',
        available_cities: Object.keys(mockWeatherData)
      };
    }
    
    const weather = mockWeatherData[weatherKey as keyof typeof mockWeatherData];
    let temperature = weather.temp;
    
    if (units === 'fahrenheit') {
      temperature = Math.round(temperature * 9/5 + 32);
    }
    
    return {
      city: weatherKey,
      country,
      temperature: `${temperature}°${units === 'fahrenheit' ? 'F' : 'C'}`,
      condition: weather.condition,
      humidity: `${weather.humidity}%`,
      units
    };
  }
};

/**
 * Time tool to get current time in different timezones
 */
export const timeTool: AssistantTool = {
  name: 'get_time',
  description: 'Get current time in a specific timezone or UTC',
  parameters: {
    type: 'object',
    properties: {
      timezone: {
        type: 'string',
        description: 'Timezone (e.g., "America/New_York", "Europe/London", "Asia/Tokyo") or "UTC"',
        default: 'UTC'
      },
      format: {
        type: 'string',
        enum: ['12h', '24h'],
        description: 'Time format',
        default: '24h'
      }
    }
  },
  execute: async (args: { timezone?: string; format?: string }) => {
    const { timezone = 'UTC', format = '24h' } = args;
    
    try {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: format === '12h'
      };
      
      const formattedTime = now.toLocaleString('en-US', options);
      
      return {
        timezone,
        current_time: formattedTime,
        format,
        timestamp: now.getTime()
      };
    } catch (error) {
      return {
        error: `Invalid timezone: ${timezone}`,
        available_examples: ['UTC', 'America/New_York', 'Europe/London', 'Asia/Tokyo', 'Australia/Sydney']
      };
    }
  }
};

/**
 * Text processing tool
 */
export const textProcessorTool: AssistantTool = {
  name: 'process_text',
  description: 'Process text with various operations like counting, reversing, or case conversion',
  parameters: {
    type: 'object',
    properties: {
      text: {
        type: 'string',
        description: 'The text to process'
      },
      operation: {
        type: 'string',
        enum: ['count_words', 'count_chars', 'reverse', 'uppercase', 'lowercase', 'title_case'],
        description: 'The operation to perform on the text'
      }
    },
    required: ['text', 'operation']
  },
  execute: async (args: { text: string; operation: string }) => {
    const { text, operation } = args;
    
    switch (operation) {
      case 'count_words':
        const wordCount = text.trim().split(/\s+/).length;
        return { operation, input: text, result: wordCount, unit: 'words' };
      
      case 'count_chars':
        return { operation, input: text, result: text.length, unit: 'characters' };
      
      case 'reverse':
        return { operation, input: text, result: text.split('').reverse().join('') };
      
      case 'uppercase':
        return { operation, input: text, result: text.toUpperCase() };
      
      case 'lowercase':
        return { operation, input: text, result: text.toLowerCase() };
      
      case 'title_case':
        const titleCase = text.replace(/\w\S*/g, (txt) => 
          txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        );
        return { operation, input: text, result: titleCase };
      
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  }
};

/**
 * All available tools
 */
export const availableTools: AssistantTool[] = [
  calculatorTool,
  weatherTool,
  timeTool,
  textProcessorTool
];