import { ChatService } from './src/chatService';

async function testContextReuse() {
  const chatService = new ChatService();

  // Simulate a search query
  console.log('Test 1: Search query');
  const response1 = await chatService.sendMessage(
    'Search for TypeScript tutorials'
  );
  console.log('Response 1:', response1.substring(0, 100));

  // Simulate a follow-up about results
  console.log('\nTest 2: Follow-up question about results');
  const response2 = await chatService.sendMessage('Can I see the results?');
  console.log('Response 2:', response2.substring(0, 100));

  // Check if lastSearchResults was reused
  console.log('\nTest 3: Another context reference');
  const response3 = await chatService.sendMessage('Show me those links again');
  console.log('Response 3:', response3.substring(0, 100));

  console.log('\nTest completed!');
}

testContextReuse().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
