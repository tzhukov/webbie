# Local Felix 🤖

A TypeScript-based Terminal UI (TUI) chatbot that connects to your local Ollama server, powered by LlamaIndex with integrated web search and local RAG (vector) context.

## Features

- 💬 **Interactive TUI Chat Interface** - Beautiful terminal-based chat experience using Ink
- 🦙 **Ollama Integration** - Connects to local Ollama server via LlamaIndex
- 🔍 **Web Search** - Automatically performs web searches when needed using DuckDuckGo
- 📝 **Conversation History** - Maintains context throughout your chat session
- 🎨 **Clean UI** - Color-coded messages with intuitive commands

## Prerequisites

Before running Local Felix, you need to have:

1. **Node.js** (v18 or higher)
2. **Ollama** installed and running on your network
  - Install from: https://ollama.ai
  - Default server used here: `http://10.0.0.227:11434`
  - Pull a chat model: `ollama pull qwen3:4b`
  - Pull an embedding model for RAG: `ollama pull nomic-embed-text`
3. **(Optional) Local knowledge base**
  - Add `.txt` / `.md` files under `./data` to be indexed for RAG

## Installation

1. Clone or navigate to this repository:
```bash
cd local-felix
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

## Usage

### Starting the Chatbot

Run the application:
```bash
npm start
```

Or use dev mode (builds and runs):
```bash
npm run dev
```

### Commands

While in the chat:
- **Type your message** and press `Enter` to chat
- **`exit`** or **`quit`** - Exit the application
- **`clear`** - Clear conversation history

### Web Search

The chatbot automatically detects when you need web information. Try phrases like:
- "search for latest news on AI"
- "what is the current weather in Paris"
- "look up TypeScript best practices"
- "find information about quantum computing"

## Project Structure

```
local-felix/
├── src/
│   ├── index.tsx          # Main TUI application (Ink/React)
│   ├── chatService.ts     # Chat service with Ollama/LlamaIndex
│   └── webSearch.ts       # Web search functionality
├── dist/                  # Compiled JavaScript output
├── package.json
├── tsconfig.json
└── README.md
```

## Configuration

### Changing the Model

You can use environment variables to change the model or host without code changes:

```bash
export OLLAMA_MODEL="mistral"
export OLLAMA_HOST="http://10.0.0.227:11434"
export RAG_EMBED_MODEL="nomic-embed-text"
export RAG_EMBED_HOST="http://10.0.0.227:11434"
```

Or edit [src/index.tsx](src/index.tsx) to use a different Ollama model explicitly:

```typescript
const [chatService] = useState(() => new ChatService({ model: 'mistral', host: 'http://10.0.0.227:11434' }));
// Change the model/host as needed.
```

### Ollama Server URL

The default Ollama server URL is `http://10.0.0.227:11434`. To change it, set the `OLLAMA_HOST` environment variable or update the `host` passed to `ChatService`.

### Retrieval-Augmented Generation (RAG)

- Place your reference files ( `.txt`, `.md`, `.mdx`) in the `data/` directory. They will be indexed into an in-memory vector store at startup/first query.
- Control RAG via env or constructor:

```bash
export OLLAMA_HOST="http://10.0.0.227:11434"
export OLLAMA_MODEL="qwen3:4b"
export RAG_DATA_DIR="./data"      # optional override
export RAG_TOP_K=3                 # optional override
```

Or in code:

```typescript
const chat = new ChatService({
  host: 'http://10.0.0.227:11434',
  model: 'qwen3:4b',
  rag: { enabled: true, dataDir: './data', topK: 3, embedModel: 'nomic-embed-text', embedHost: 'http://10.0.0.227:11434' }
});
```

## Development

### Build
```bash
npm run build
```

### Watch Mode
```bash
npm run watch
```

This will automatically recompile TypeScript files on changes.

### Tests

Integration tests expect an accessible Ollama server. By default they target `http://10.0.0.227:11434` and the `qwen3:4b` model. Override with env vars if needed:

```bash
export OLLAMA_HOST="http://10.0.0.227:11434"
export OLLAMA_MODEL="qwen3:4b"
npm test
```

RAG unit tests are skipped by default to avoid requiring an embedding model. Enable them with:

```bash
export RUN_RAG_TESTS=1
npm test
```

## How It Works

1. **TUI Interface**: Built with Ink (React for CLIs), providing a responsive terminal interface
2. **LlamaIndex Integration**: Uses LlamaIndex's Ollama client to communicate with your local Ollama server
3. **Web Search**: Detects search intent in your messages and fetches relevant web results from DuckDuckGo
4. **Context Enhancement**: Combines web search results with your query to provide informed responses

## Technologies Used

- **TypeScript** - Type-safe development
- **LlamaIndex** - LLM orchestration framework
- **Ollama** - Local LLM server
- **Ink** - React for interactive CLIs
- **Axios** - HTTP client for web requests
- **Cheerio** - HTML parsing for web scraping

## Troubleshooting

### "Failed to get response from Ollama"
- Ensure Ollama is running: `ollama serve`
- Verify the model is installed: `ollama list`
- Check if you can access: `curl http://10.0.0.227:11434/api/tags`
- Make sure the embedding model is pulled for RAG: `ollama pull nomic-embed-text`
- Export host/model env vars if you run on a different host:
  ```bash
  export OLLAMA_HOST=http://10.0.0.227:11434
  export OLLAMA_MODEL=qwen3:4b
  export RAG_EMBED_MODEL=nomic-embed-text
  export RAG_EMBED_HOST=http://10.0.0.227:11434
  ```

### No search results
- Check your internet connection
- DuckDuckGo might be rate-limiting requests

### Build errors
- Ensure you're using Node.js v18+: `node --version`
- Delete `node_modules` and `dist`, then reinstall:
  ```bash
  rm -rf node_modules dist
  npm install
  npm run build
  ```

## License

MIT

## Contributing

Feel free to open issues or submit pull requests!
