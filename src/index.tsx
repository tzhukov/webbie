import React, { useState, useEffect } from 'react';
import { render, Box, Text, useInput, useApp } from 'ink';
import { ChatService } from './chatService.js';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [chatService] = useState(() => new ChatService());
  const { exit } = useApp();

  useEffect(() => {
    // Display welcome message
    setMessages([
      {
        role: 'assistant',
        content: 'Welcome to Local Felix! I\'m your AI assistant powered by Ollama.\n\nI can help you with questions and perform web searches.\nType your message and press Enter to chat.\nType "exit" or "quit" to leave.\nType "clear" to clear the conversation history.\n'
      }
    ]);
  }, []);

  useInput(async (input: string, key: any) => {
    if (isProcessing) return;

    if (key.return) {
      const userInput = currentInput.trim();
      setCurrentInput('');

      if (!userInput) return;

      // Handle commands
      if (userInput.toLowerCase() === 'exit' || userInput.toLowerCase() === 'quit') {
        exit();
        return;
      }

      if (userInput.toLowerCase() === 'clear') {
        chatService.clearHistory();
        setMessages([
          {
            role: 'assistant',
            content: 'Conversation history cleared.'
          }
        ]);
        return;
      }

      // Add user message
      setMessages(prev => [...prev, { role: 'user', content: userInput }]);
      setIsProcessing(true);

      try {
        // Get response from chat service
        const response = await chatService.sendMessage(userInput);
        setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      } catch (error: any) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `Error: ${error.message}` 
        }]);
      } finally {
        setIsProcessing(false);
      }
    } else if (key.backspace || key.delete) {
      setCurrentInput(prev => prev.slice(0, -1));
    } else if (!key.escape && !key.ctrl && !key.meta && input.length >= 1) {
      // Accept multi-character chunks to support paste
      setCurrentInput(prev => prev + input);
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Box borderStyle="round" borderColor="cyan" flexDirection="column" padding={1}>
        <Text bold color="cyan">
          🤖 Local Felix - Ollama Chat Assistant
        </Text>
      </Box>

      <Box flexDirection="column" marginTop={1} marginBottom={1}>
        {messages.map((msg, index) => (
          <Box key={index} flexDirection="column" marginBottom={1}>
            <Text bold color={msg.role === 'user' ? 'green' : 'blue'}>
              {msg.role === 'user' ? '👤 You' : '🤖 Assistant'}:
            </Text>
            <Text>{msg.content}</Text>
          </Box>
        ))}

        {isProcessing && (
          <Box>
            <Text color="yellow">⏳ Thinking...</Text>
          </Box>
        )}
      </Box>

      <Box borderStyle="single" borderColor="gray" padding={1}>
        <Text color="gray">
          {'> '}
        </Text>
        <Text>{currentInput}</Text>
        <Text color="gray">▊</Text>
      </Box>

      <Box marginTop={1}>
        <Text dimColor>
          Commands: exit/quit (leave) | clear (reset conversation)
        </Text>
      </Box>
    </Box>
  );
};

render(<App />);
