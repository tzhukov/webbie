// Quick test of extractSearchQuery regex logic
const testMessage = "Search memory.net for 8gb 2133mhz ddr4 laptop sized ram";
const lowerMessage = testMessage.toLowerCase();
const siteMatch = lowerMessage.match(/search(?:es)?\s+(?:for\s+)?([a-z0-9.-]+)\s+for\s+(.+)$/i);

console.log("Input:", testMessage);
console.log("Match result:", siteMatch);

if (siteMatch) {
  const [, domain, searchTerm] = siteMatch;
  console.log("Domain:", domain);
  console.log("Search term:", searchTerm);
  if (domain.includes('.') || domain.includes('-')) {
    const result = `site:${domain} ${searchTerm.trim()}`;
    console.log("Final query:", result);
  }
} else {
  console.log("No site-specific match");
}

// Test case 2
console.log("\n---\n");
const testMessage2 = "Search for TypeScript tutorials";
const lowerMessage2 = testMessage2.toLowerCase();
const siteMatch2 = lowerMessage2.match(/search(?:es)?\s+(?:for\s+)?([a-z0-9.-]+)\s+for\s+(.+)$/i);
console.log("Input:", testMessage2);
console.log("Match result:", siteMatch2);
if (!siteMatch2) {
  let query = lowerMessage2
    .replace(/^(search for|look up|find information about|what is|who is|when did|where is|find|search)\s+/i, '')
    .trim();
  console.log("Final query:", query);
}

// Test case 3: "search on <domain>"
console.log("\n---\n");
const testMessage3 = "Can you search on memory.net";
const lowerMessage3 = testMessage3.toLowerCase();
const siteMatch3 = lowerMessage3.match(/search(?:es)?(?:\s+on)?\s+([a-z0-9.-]+\.[a-z]{2,})(?:\s+(.*))?$/i);
console.log("Input:", testMessage3);
console.log("Match result:", siteMatch3);
if (siteMatch3) {
  const [, domain, rest] = siteMatch3;
  const term = (rest || '').trim();
  const result = term ? `site:${domain} ${term}` : `site:${domain}`;
  console.log("Final query:", result);
}
