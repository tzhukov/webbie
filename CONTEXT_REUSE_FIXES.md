# Context Reuse & Site-Specific Search Fixes

## Changes Made

### 1. Site-Specific Search Support
**File:** [src/chatService.ts](src/chatService.ts#L228-L248)

Enhanced `extractSearchQuery()` to parse site-specific queries:
- Input: "Search memory.net for 8gb 2133mhz ddr4"
- Output: "site:memory.net 8gb 2133mhz ddr4"

This passes the site modifier to DuckDuckGo's search, which respects the `site:` operator.

```typescript
const siteMatch = query.match(/^([a-z0-9.-]+)\s+for\s+(.+)$/i);
if (siteMatch) {
  const [, domain, searchTerm] = siteMatch;
  if (domain.includes('.') || domain.includes('-')) {
    query = `site:${domain} ${searchTerm}`;
  }
}
```

### 2. System Prompt Enhanced for Link Display
**File:** [src/chatService.ts](src/chatService.ts#L37-L42)

Updated system prompt to explicitly instruct the model to display links exactly as provided:

```
"When showing web search results (including links or URLs), display them exactly 
as provided in the context without paraphrasing or rewriting the links."
```

This prevents the model from summarizing links and instead shows them directly.

### 3. Context Reuse (Previously Implemented)
**File:** [src/chatService.ts](src/chatService.ts#L28), [src/chatService.ts](src/chatService.ts#L126-L130), [src/chatService.ts](src/chatService.ts#L228-L243)

- Caches search results in `lastSearchResults` field
- Detects context-reference questions (show, display, results, see, etc.)
- Reuses cached results for follow-up questions without new search

## Expected Behavior

**Scenario 1: Site-Specific Search**
```
User: "Search memory.net for 8GB DDR4 2133MHz"
→ Query becomes: "site:memory.net 8gb ddr4 2133mhz"
→ DuckDuckGo searches specifically on memory.net
→ Results show memory.net links
```

**Scenario 2: Link Display**
```
First Query Results (formatted):
1. Product Name
   URL: https://...
   Snippet: ...

Model Response:
→ Now displays the actual formatted links
→ Does NOT paraphrase or create new URLs
→ Uses "(from web search)" citation
```

**Scenario 3: Follow-up Context Reuse**
```
User: "Can you show me the links?"
→ detectSearchIntent() = false
→ couldBeContextReferenceQuestion() = true (finds "links")
→ Reuses lastSearchResults from previous query
→ Logs: context: last-search-results:reused
```

## How to Test

1. **Test site-specific search:**
   ```
   User: "Search memory.net for 8gb laptop ram"
   → Verify results show memory.net URLs
   ```

2. **Test link display:**
   ```
   User: "Search for TypeScript tutorials"
   → First response should show formatted links, not paraphrased summary
   ```

3. **Test context reuse:**
   ```
   User: "Search for something"
   User: "Can I see the results?" 
   → Logs should show: context: last-search-results:reused
   ```

## Technical Notes

- **DuckDuckGo Site Operator**: DuckDuckGo supports `site:domain.com` operator just like Google
- **Context Keywords**: show, display, results, see, list, links, sources, those, again, previous, before, earlier
- **Formatted Results**: Stored in `this.lastSearchResults` and `this.lastSearchResults` cache
- **Logs**: Watch for `search:start`, `search:results count=`, `context: last-search-results:reused`
