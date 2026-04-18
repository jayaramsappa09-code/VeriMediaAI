// ── VeriMedia Prompt Builder ──────────────────────────────────────────────────

function buildDecisionPrompt({ scenario, contentType, sim, integrity, matches }) {
  const simPct = Math.round(sim * 100);
  const intPct = Math.round(integrity * 100);
  const trustPct = Math.round(sim * integrity * 100);
  const matchSummary = matches.slice(0, 3).map(m =>
    `- ${m.platName || m.platId || 'Unknown'} / ${m.user || 'unknown'}: ${Math.round((m.similarity || sim) * 100)}% similarity`
  ).join('\n') || '- No matches provided';

  return `You are VeriMedia AI, a media rights enforcement reasoning engine. Analyze this detection case and provide a decision with reasoning.

DETECTION DATA:
- Scenario: ${scenario}
- Content type: ${contentType || 'general'}
- Visual similarity to original: ${simPct}%
- Integrity score: ${intPct}%
- Combined trust score: ${trustPct}%
- Matches found:
${matchSummary}

DECISION THRESHOLDS:
- ALLOW: trust > 75%
- REVIEW REQUIRED: trust 40-75%
- TAKEDOWN: trust < 40%
- EMERGENCY_TAKEDOWN: trust < 30% AND viral spread > 85%

Respond with:
1. Decision: [ALLOW / REVIEW REQUIRED / TAKEDOWN / EMERGENCY_TAKEDOWN]
2. Three concise reasoning bullets (max 25 words each) explaining the key signals
3. Recommended action in one sentence

Be direct and analytical. No disclaimers.`;
}

function buildEmbeddingPrompt({ scenario, sim, contentType }) {
  const simPct = Math.round(sim * 100);
  return `Interpret this embedding similarity result for a media forensics system.

Similarity: ${simPct}%
Scenario: ${scenario}
Content type: ${contentType || 'general'}

In one sentence (max 20 words), explain what this similarity score means for copyright enforcement. Be direct.`;
}

function buildExternalSearchPrompt({ scenario, tags, matchCount }) {
  return `You are analyzing web search results for unauthorized media distribution.

Content scenario: ${scenario}
Search tags: ${tags || scenario}
Platform matches found: ${matchCount}

Summarize the external distribution threat in 2 sentences. Include risk level (LOW/MEDIUM/HIGH/CRITICAL).`;
}

module.exports = { buildDecisionPrompt, buildEmbeddingPrompt, buildExternalSearchPrompt };
