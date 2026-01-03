import axios from 'axios';
import * as cheerio from 'cheerio';

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export class WebSearchTool {
  /**
   * Attempts direct on-site search using common query params.
   * Tries multiple endpoints and returns anchors pointing to the same domain.
   */
  async searchDomainDirect(domain: string, term: string, maxResults: number = 5): Promise<SearchResult[]> {
    const endpoints = [
      `https://${domain}/search?q=${encodeURIComponent(term)}`,
      `https://${domain}/?s=${encodeURIComponent(term)}`,
      `https://${domain}/search?query=${encodeURIComponent(term)}`,
      `https://${domain}/?q=${encodeURIComponent(term)}`
    ];

    const words = term.toLowerCase().split(/\s+/).filter(w => w.length > 2);

    const results: SearchResult[] = [];

    for (const url of endpoints) {
      try {
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          timeout: 8000,
          maxContentLength: 5_000_000,
          maxBodyLength: 5_000_000
        });

        const $ = cheerio.load(response.data);
        const anchors = $('a[href]');

        anchors.each((_, el) => {
          if (results.length >= maxResults) return false;

          const href = $(el).attr('href') || '';
          let resolved: string;
          try {
            resolved = new URL(href, url).toString();
          } catch {
            return;
          }

          const host = (() => {
            try { return new URL(resolved).hostname; } catch { return ''; }
          })();

          if (!host.endsWith(domain)) return;

          const text = ($(el).text() || '').trim();
          const containerText = ($(el).closest('article, li, div, p').text() || '').replace(/\s+/g, ' ').trim();
          const snippetSource = containerText || text;
          const snippetLower = snippetSource.toLowerCase();

          const hasKeyword = words.length === 0 || words.some(w => snippetLower.includes(w));
          if (!hasKeyword) return;

          if (text.length === 0 && snippetSource.length === 0) return;

          results.push({
            title: text || snippetSource.slice(0, 80),
            url: resolved,
            snippet: snippetSource.slice(0, 200)
          });
        });

        if (results.length > 0) {
          return results.slice(0, maxResults);
        }
      } catch (err) {
        // try next endpoint
        continue;
      }
    }

    return results.slice(0, maxResults);
  }
  /**
   * Performs a web search using DuckDuckGo HTML search
   */
  async search(query: string, maxResults: number = 5): Promise<SearchResult[]> {
    try {
      const response = await axios.get('https://html.duckduckgo.com/html/', {
        params: { q: query },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      const results: SearchResult[] = [];

      $('.result').each((i, elem) => {
        if (i >= maxResults) return false;

        const titleElem = $(elem).find('.result__a');
        const snippetElem = $(elem).find('.result__snippet');
        const urlElem = $(elem).find('.result__url');

        const title = titleElem.text().trim();
        const snippet = snippetElem.text().trim();
        let url = urlElem.text().trim();

        // Extract actual URL from DuckDuckGo redirect
        const linkHref = titleElem.attr('href');
        if (linkHref) {
          try {
            const urlMatch = linkHref.match(/uddg=([^&]+)/);
            if (urlMatch) {
              url = decodeURIComponent(urlMatch[1]);
            }
          } catch (e) {
            // Use the displayed URL if extraction fails
          }
        }

        if (title && url) {
          results.push({ title, url, snippet });
        }
      });

      return results;
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  }

  /**
   * Fetches and extracts text content from a URL
   */
  async fetchPageContent(url: string): Promise<string> {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000,
        maxContentLength: 5_000_000,
        maxBodyLength: 5_000_000
      });

      const $ = cheerio.load(response.data);
      
      // Remove script, style, and other non-content elements
      $('script, style, nav, footer, header, aside, .ad, .advertisement').remove();
      
      // Get main content text
      const mainContent = $('main, article, .content, #content, body').first().text();
      
      // Clean up whitespace
      return mainContent
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 4000); // Limit to 4000 chars
    } catch (error) {
      console.error('Fetch error:', error);
      return '';
    }
  }

  /**
   * Creates a formatted search summary
   */
  formatSearchResults(results: SearchResult[]): string {
    if (results.length === 0) {
      return 'No search results found.';
    }

    let formatted = 'Search Results:\n\n';
    results.forEach((result, index) => {
      formatted += `${index + 1}. ${result.title}\n`;
      formatted += `   URL: ${result.url}\n`;
      if (result.snippet) {
        formatted += `   ${result.snippet}\n`;
      }
      formatted += '\n';
    });

    return formatted;
  }
}
