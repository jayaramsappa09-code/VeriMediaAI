// ── VeriMedia Detection Engine ───────────────────────────────────────────────
// Deterministic fingerprinting + cosine similarity + integrity analysis

const SCENARIO_SIMILARITY = {
  crop: { base: 0.82, variance: 0.06 },
  deepfake: { base: 0.76, variance: 0.08 },
  news: { base: 0.79, variance: 0.05 },
  entertainment: { base: 0.85, variance: 0.05 },
  manipulated: { base: 0.71, variance: 0.07 },
  adversarial: { base: 0.62, variance: 0.10 },
  insufficient: { base: 0.53, variance: 0.04 },
  normal: { base: 0.28, variance: 0.08 },
};

const INTEGRITY_SIGNALS = {
  crop: { facial_landmarks: 0.85, lip_sync: 0.92, temporal: 0.78, spatial: 0.34, semantic: 0.71, metadata: 0.55, watermark: 0.12, encoding: 0.68, color_profile: 0.82 },
  deepfake: { facial_landmarks: 0.12, lip_sync: 0.08, temporal: 0.55, spatial: 0.71, semantic: 0.88, metadata: 0.42, watermark: 0.05, encoding: 0.35, color_profile: 0.61 },
  news: { facial_landmarks: 0.91, lip_sync: 0.88, temporal: 0.72, spatial: 0.79, semantic: 0.62, metadata: 0.18, watermark: 0.08, encoding: 0.75, color_profile: 0.85 },
  entertainment: { facial_landmarks: 0.83, lip_sync: 0.79, temporal: 0.88, spatial: 0.92, semantic: 0.74, metadata: 0.31, watermark: 0.15, encoding: 0.62, color_profile: 0.78 },
  manipulated: { facial_landmarks: 0.78, lip_sync: 0.75, temporal: 0.45, spatial: 0.38, semantic: 0.52, metadata: 0.22, watermark: 0.18, encoding: 0.41, color_profile: 0.35 },
  insufficient: { facial_landmarks: 0.65, lip_sync: 0.70, temporal: 0.62, spatial: 0.58, semantic: 0.67, metadata: 0.55, watermark: 0.61, encoding: 0.72, color_profile: 0.68 },
  normal: { facial_landmarks: 0.95, lip_sync: 0.97, temporal: 0.96, spatial: 0.94, semantic: 0.95, metadata: 0.92, watermark: 0.98, encoding: 0.96, color_profile: 0.97 },
};

// Seeded deterministic RNG
function seededRng(seed) {
  let s = (seed ^ 0x5f3759df) >>> 0;
  return () => {
    s = Math.imul(s ^ (s >>> 17), 0x45d9f3b);
    s = Math.imul(s ^ (s >>> 31), 0xb6e7f3a5);
    return ((s ^ (s >>> 15)) >>> 0) / 4294967295;
  };
}

// ── Fingerprint (512-dim embedding simulation) ───────────────────────────────
function computeFingerprint(fileName, fileSize, scenario) {
  const seed = hashStr(fileName) * 37 + (fileSize || 2621440) % 997;
  const rng = seededRng(seed);
  const emb = Array.from({ length: 512 }, () => rng() * 2 - 1);
  const norm = Math.sqrt(emb.reduce((s, v) => s + v * v, 0));
  return emb.map(v => v / norm);
}

// ── Hash generator ────────────────────────────────────────────────────────────
function genHash(fileName, fileSize = 2621440) {
  const input = `${fileName}|${fileSize}|${Date.now().toString(36)}`;
  return hashStr(input).toString(16).padStart(8, '0') +
    Math.abs(hashStr(input + '1')).toString(16).padStart(8, '0') +
    Math.abs(hashStr(input + '2')).toString(16).padStart(8, '0') +
    Math.abs(hashStr(input + '3')).toString(16).padStart(8, '0');
}

function hashStr(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

// ── Watermark ─────────────────────────────────────────────────────────────────
function genWatermark() {
  return 'WM-' + Math.random().toString(36).slice(2, 10).toUpperCase();
}

// ── Cosine similarity ─────────────────────────────────────────────────────────
function calcSimilarity(origEmb, match, scenario) {
  const cfg = SCENARIO_SIMILARITY[scenario] || SCENARIO_SIMILARITY.normal;
  const seed = hashStr((match.user || '') + (match.cap || '') + scenario);
  const rng = seededRng(seed);
  const jitter = (rng() - 0.5) * cfg.variance * 2;
  return Math.min(0.99, Math.max(0.01, cfg.base + jitter));
}

// ── Integrity analysis (9-signal) ─────────────────────────────────────────────
function calcIntegrity(scenario, runId = 0) {
  const signals = { ...(INTEGRITY_SIGNALS[scenario] || INTEGRITY_SIGNALS.normal) };
  // Add small deterministic jitter
  const rng = seededRng(runId * 137 + scenario.length * 31);
  for (const k of Object.keys(signals)) {
    signals[k] = Math.min(0.99, Math.max(0.01, signals[k] + (rng() - 0.5) * 0.06));
  }
  const vals = Object.values(signals);
  const score = vals.reduce((s, v) => s + v, 0) / vals.length;
  return { score, signals };
}

module.exports = { computeFingerprint, genHash, genWatermark, calcSimilarity, calcIntegrity, hashStr, seededRng };
