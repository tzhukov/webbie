import fs from 'node:fs/promises';
import path from 'node:path';
import { Document, VectorStoreIndex, Settings, SimpleVectorStore } from 'llamaindex';
import { ModalityType } from '@llamaindex/core/schema';
import { BaseEmbedding } from '@llamaindex/core/embeddings';

export interface RagConfig {
  dataDir?: string;
  topK?: number;
  embedModel?: string;
  embedHost?: string;
}

/**
 * Minimal local embedding to avoid remote dependencies.
 */
class LocalEmbedding extends BaseEmbedding {
  private dims = 128;

  constructor() {
    super();
  }

  async getTextEmbedding(text: string): Promise<number[]> {
    const vector = new Array<number>(this.dims).fill(0);
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      const idx = code % this.dims;
      vector[idx] += (code % 13) - 6; // small signed contribution
    }
    // L2 normalize to keep magnitudes consistent
    const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0)) || 1;
    return vector.map(v => v / norm);
  }
}

/**
 * Loads local documents into an in-memory vector index and retrieves relevant context.
 */
export class RagService {
  private dataDir: string;
  private topK: number;
  private index: VectorStoreIndex | null = null;
  private loading: Promise<void> | null = null;
  private available = true;
  private embedding: BaseEmbedding;

  constructor(config: RagConfig = {}) {
    this.dataDir = config.dataDir || path.resolve(process.cwd(), 'data');
    this.topK = config.topK ?? 3;
    this.embedding = new LocalEmbedding();

    // Prefer a local embedding model to avoid remote dependencies.
    if (!Settings.embedModel) {
      Settings.embedModel = this.embedding;
    }
  }

  /**
   * Ensure the index is built once.
   */
  async ensureReady(): Promise<void> {
    if (this.index) return;
    if (this.loading) return this.loading;

    this.loading = this.buildIndex();
    await this.loading;
  }

  private async buildIndex(): Promise<void> {
    try {
      const documents = await this.loadDocuments();
      if (documents.length === 0) {
        this.index = null;
        return;
      }
      const vectorStore = new SimpleVectorStore({ embeddingModel: this.embedding });
      this.index = await VectorStoreIndex.fromDocuments(documents, {
        vectorStores: { [ModalityType.TEXT]: vectorStore }
      });
    } catch (err) {
      console.error('RAG index build failed:', err);
      this.index = null;
      this.available = false;
    }
  }

  private async loadDocuments(): Promise<Document[]> {
    try {
      const entries = await fs.readdir(this.dataDir, { withFileTypes: true });
      const files = entries
        .filter(e => e.isFile())
        .map(e => path.join(this.dataDir, e.name))
        .filter(file => this.isTextFile(file));

      const docs: Document[] = [];
      for (const file of files) {
        const text = await fs.readFile(file, 'utf8');
        if (text.trim().length === 0) continue;
        docs.push(new Document({
          text,
          metadata: { source: path.basename(file) }
        }));
      }
      return docs;
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        return [];
      }
      throw err;
    }
  }

  private isTextFile(file: string): boolean {
    const ext = path.extname(file).toLowerCase();
    return ['.txt', '.md', '.mdx'].includes(ext);
  }

  /**
   * Returns concatenated context from top-K retrieved nodes.
   */
  async retrieveContext(query: string): Promise<string> {
    await this.ensureReady();
    if (!this.available || !this.index) return '';

    const retriever = this.index.asRetriever({ similarityTopK: this.topK });
    const nodes = await retriever.retrieve(query);

    const parts = nodes
      .map(n => {
        const node: any = (n as any).node ?? n;
        return node?.getContent?.() ?? node?.text ?? '';
      })
      .filter(Boolean)
      .map((text, idx) => `(${idx + 1}) ${text.trim()}`);

    if (parts.length === 0) return '';
    return `Retrieved Context:\n${parts.join('\n\n')}`;
  }
}
