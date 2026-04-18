// ── VeriMedia Decision Engine ─────────────────────────────────────────────────

const THRESHOLDS = {
  ALLOW: 0.75,
  REVIEW_UPPER: 0.75,
  REVIEW_LOWER: 0.40,
  TAKEDOWN: 0.40,
  EMERGENCY_TRUST: 0.30,
  EMERGENCY_VIRAL: 85,
};

function applyDecisionRules(trustScore, viralScore = 0) {
  if (trustScore < THRESHOLDS.EMERGENCY_TRUST && viralScore > THRESHOLDS.EMERGENCY_VIRAL) return 'EMERGENCY_TAKEDOWN';
  if (trustScore < THRESHOLDS.TAKEDOWN) return 'TAKEDOWN';
  if (trustScore <= THRESHOLDS.REVIEW_UPPER) return 'REVIEW REQUIRED';
  return 'ALLOW';
}

function buildReasoning(sim, integrity, trustScore, viralScore, decision) {
  const reasons = [];
  const simPct = Math.round(sim * 100);
  const intPct = Math.round(integrity * 100);
  const trustPct = Math.round(trustScore * 100);

  if (simPct >= 80) reasons.push(`High visual similarity detected (${simPct}%) — strong fingerprint match indicates unauthorized use`);
  else if (simPct >= 60) reasons.push(`Moderate visual similarity (${simPct}%) — content shares significant characteristics with registered asset`);
  else reasons.push(`Low visual similarity (${simPct}%) — insufficient match for enforcement action`);

  if (intPct < 40) reasons.push(`Integrity score critically low (${intPct}%) — multiple signals indicate heavy manipulation`);
  else if (intPct < 65) reasons.push(`Integrity degraded (${intPct}%) — content shows signs of modification or re-encoding`);
  else reasons.push(`Integrity signals nominal (${intPct}%) — content appears structurally intact`);

  if (viralScore > 75) reasons.push(`Viral anomaly detected (score: ${Math.round(viralScore)}%) — rapid spread across platforms escalates risk`);
  else if (viralScore > 40) reasons.push(`Moderate spread velocity (${Math.round(viralScore)}%) — content distribution above baseline`);

  if (decision === 'ALLOW') reasons.push('Trust score above enforcement threshold — content authorized or insufficient evidence to act');
  else if (decision === 'TAKEDOWN') reasons.push(`Combined trust score (${trustPct}%) below takedown threshold — enforcement action recommended`);
  else if (decision === 'EMERGENCY_TAKEDOWN') reasons.push('CRITICAL: Low trust + viral anomaly — immediate takedown required to prevent widespread distribution');
  else reasons.push(`Trust score (${trustPct}%) in review zone — manual analyst inspection required before action`);

  return reasons;
}

module.exports = { applyDecisionRules, buildReasoning, THRESHOLDS };
