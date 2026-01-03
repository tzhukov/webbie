import { Ollama } from 'llamaindex';
import { WebSearchTool } from './webSearch.js';
import { RagService, RagConfig } from './ragService.js';
import { logLine } from './logger.js';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatConfig {
  model?: string;
  host?: string;
  rag?: RagConfig & { enabled?: boolean };
}

export class ChatService {
  private ollama: Ollama;
  private webSearch: WebSearchTool;
  private conversationHistory: Message[];
  private model: string;

  private host: string;
  private ragService?: RagService;
  private ragEnabled: boolean;
  private connectionChecked = false;
  private systemPrompt: string;
  private lastSearchResults: string = '';

  constructor(config: ChatConfig = {}) {
    const fallbackModel = 'qwen3:4b';
    const fallbackHost = 'http://10.0.0.227:11434';

    this.model = config.model || process.env.OLLAMA_MODEL || fallbackModel;
    this.host = config.host || process.env.OLLAMA_HOST || fallbackHost;
    this.ragEnabled = config.rag?.enabled ?? true;
    this.systemPrompt = [
      'You are a local assistant. When web search context is provided, you MUST use it and cite that it is from a web search.',
      'When showing web search results (including links or URLs), display them exactly as provided in the context without paraphrasing or rewriting the links.',
      'Always state whether web search was used. If none was used, say "(no web search used)".',
      'Be concise and avoid invented links. Do not fabricate sources.'
    ].join(' ');
    if (this.ragEnabled) {
      this.ragService = new RagService({
        dataDir: config.rag?.dataDir,
        topK: config.rag?.topK
      });
    }

    this.ollama = new Ollama({ 
      model: this.model,
      config: {
        host: this.host
      }
    });
    this.webSearch = new WebSearchTool();
    this.conversationHistory = [
      {
        role: 'system',
        content: this.systemPrompt
      }
    ];

    void logLine(
      `session:start host=${this.host} model=${this.model} rag=${this.ragEnabled ? 'on' : 'off'}`
    );
  }

  /**
   * Sends a message and gets a response
   */
  async sendMessage(userMessage: string): Promise<string> {
    // Quick connectivity check once per session
    if (!this.connectionChecked) {
      await this.ensureConnection();
      this.connectionChecked = true;
    }

    // Add user message to history
    this.conversationHistory.push({
      role: 'user',
      content: userMessage
    });

    await logLine(`user: ${this.truncate(userMessage)}`);

    const contextParts: string[] = [];

    // RAG retrieval
    if (this.ragEnabled && this.ragService) {
      const ragContext = await this.ragService.retrieveContext(userMessage);
      if (ragContext) {
        contextParts.push(ragContext);
        await logLine('context: rag:hit');
      } else {
        await logLine('context: rag:miss');
      }
    } else {
      await logLine('context: rag:disabled');
    }

    // Check if the user is requesting a web search
    const searchIntent = this.detectSearchIntent(userMessage);

    if (searchIntent) {
      const searchQuery = this.extractSearchQuery(userMessage);
      await logLine(`search:start query="${searchQuery}"`);
      const searchResults = await this.webSearch.search(searchQuery, 3);
      
      if (searchResults.length > 0) {
        this.lastSearchResults = 'Web Search Results:\n' + this.webSearch.formatSearchResults(searchResults);
        contextParts.push(this.lastSearchResults);
        await logLine(`search:results count=${searchResults.length}`);
        
        // Optionally fetch content from the first result
        if (searchResults[0]) {
          const pageContent = await this.webSearch.fetchPageContent(searchResults[0].url);
          if (pageContent) {
            contextParts.push(`Content from ${searchResults[0].title}:\n${pageContent.substring(0, 2000)}...`);
            await logLine('search:page:included');
          }
        }
      }
      if (searchResults.length === 0) {
        await logLine('search:results count=0');
      }
    } else if (this.lastSearchResults && this.couldBeContextReferenceQuestion(userMessage)) {
      // User is asking about previous search results; reuse them without new search
      contextParts.push(this.lastSearchResults);
      await logLine('context: last-search-results:reused');
    } else {
      await logLine('search:intent:false');
    }

    try {
      // Prepare the prompt with context
      const context = contextParts.join('\n\n');
      if (contextParts.length === 0) {
        await logLine('context: compiled:empty');
      } else {
        await logLine(`context: compiled:count=${contextParts.length}`);
      }
      const promptWithContext = context 
        ? `${userMessage}\n\n${context}\n\nInstructions: Use the web search/RAG context above. Say "(from web search)" when you use it. If no useful context, answer concisely and say "(no web search used)".`
        : `${userMessage}\n\nIf you did not receive any web context, answer concisely and say "(no web search used)".`;

      // Get response from Ollama via LlamaIndex
      const response = await this.ollama.chat({
        messages: this.conversationHistory.map(msg => ({
          role: msg.role,
          content: msg.role === 'user' && msg.content === userMessage 
            ? promptWithContext 
            : msg.content
        }))
      });

      const assistantMessage = typeof response.message.content === 'string' 
        ? response.message.content 
        : JSON.stringify(response.message.content);

      // Add assistant response to history
      this.conversationHistory.push({
        role: 'assistant',
        content: assistantMessage
      });

      await logLine(`assistant: ${this.truncate(assistantMessage)}`);

      return assistantMessage;
    } catch (error: any) {
      console.error('Chat error:', error);
      await logLine(`error: ${error.message || 'unknown'} host=${this.host} model=${this.model}`);
      return `Error: ${error.message || 'Failed to get response from Ollama.'} (host=${this.host}, model=${this.model})`;
    }
  }

  /**
   * Checks connectivity to Ollama once per session.
   */
  private async ensureConnection(): Promise<void> {
    try {
      const res = await fetch(`${this.host.replace(/\/$/, '')}/api/tags`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000)
      });
      if (!res.ok) {
        throw new Error(`Ollama unreachable (status ${res.status})`);
      }
      await logLine(`connect: ok host=${this.host}`);
    } catch (err: any) {
      await logLine(`connect: fail host=${this.host} msg=${err.message}`);
      throw new Error(`Cannot reach Ollama at ${this.host}. Is it running and reachable from here? (${err.message})`);
    }
  }

  private truncate(text: string, max = 400): string {
    if (text.length <= max) return text;
    return `${text.slice(0, max)}...`;
  }

  /**
   * Detects if the user wants to perform a web search
   */
  private detectSearchIntent(message: string): boolean {
    const searchKeywords = [
      'search for',
      'look up',
      'find information',
      'what is',
      'who is',
      'when did',
      'where is',
      'search',
      'google',
      'find',
      'latest',
      'current',
      'news about'
    ];

    const lowerMessage = message.toLowerCase();
    return searchKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  /**
   * Extracts the search query from the user's message
   */
  private extractSearchQuery(message: string): string {
    // Remove common search prefixes
    let query = message
      .toLowerCase()
      .replace(/^(search for|look up|find information about|what is|who is|when did|where is|find|search)\s+/i, '')
      .trim();

    // Extract site-specific search (e.g., "Search memory.net for X" -> "site:memory.net X")
    const siteMatch = query.match(/^([a-z0-9.-]+)\s+for\s+(.+)$/i);
    if (siteMatch) {
      const [, domain, searchTerm] = siteMatch;
      // Check if it looks like a domain
      if (domain.includes('.') || domain.includes('-')) {
        query = `site:${domain} ${searchTerm}`;
      }
    }

    return query || message;
  }

  /**
   * Detects if the user is asking to see or reference previous search results
   */
  private couldBeContextReferenceQuestion(message: string): boolean {
    const contextKeywords = [
      'show',
      'display',
      'results',
      'see',
      'list',
      'links',
      'sources',
      'those',
      'again',
      'previous',
      'before',
      'earlier'
    ];

    const lowerMessage = message.toLowerCase();
    return contextKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  /**
   * Clears the conversation history
   */
  clearHistory(): void {
    this.conversationHistory = [];
  }

  /**
   * Gets the current conversation history
   */
  getHistory(): Message[] {
    return [...this.conversationHistory];
  }

  /**
   * Changes the model
   */
  setModel(model: string): void {
    this.model = model;
    this.ollama = new Ollama({ 
      model,
      config: {
        host: this.host
      }
    });
  }
}
