import axios from 'axios';
import * as cheerio from 'cheerio';

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export class WebSearchTool {
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
        maxContentLength: 1000000 // 1MB limit
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
