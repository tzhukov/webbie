import { ChatService } from './src/chatService.js';

// Test the extractSearchQuery method by accessing it via a message
async function testExtractSearchQuery() {
  const testCases = [
    {
      input: 'Search memory.net for 8gb 2133mhz ddr4 laptop sized ram',
      expected: 'site:memory.net 8gb 2133mhz ddr4 laptop sized ram'
    },
    {
      input: 'Search for TypeScript tutorials',
      expected: 'typescript tutorials'
    },
    {
      input: 'Look up github.com for the best repos',
      expected: 'site:github.com the best repos'
    },
    {
      input: 'Find information about nodejs',
      expected: 'nodejs'
    }
  ];

  console.log('Testing extractSearchQuery logic:\n');

  // We'll test by sending messages and checking logs
  const chatService = new ChatService();

  for (const testCase of testCases) {
    console.log(`Input: "${testCase.input}"`);
    
    // Send the message and capture what gets logged
    const oldLog = console.log;
    let capturedQuery = '';
    
    // Temporarily override logLine to capture the query
    const originalSendMessage = chatService.sendMessage.bind(chatService);
    
    console.log(`Expected search query: "${testCase.expected}"`);
    console.log('---');
  }

  console.log('\nNote: Full testing requires running the app interactively or mocking Ollama');
}

testExtractSearchQuery().catch(err => console.error(err));
