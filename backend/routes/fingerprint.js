const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { computeFingerprint, genHash, genWatermark } = require('../services/detection');
const { logger } = require('../utils/logger');

// In-memory store (replace with DB in production)
const fingerprintStore = new Map();

// ── POST /api/fingerprint/register ──────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { fileName, fileSize, scenario, dataURL } = req.body;
  if (!fileName) return res.status(400).json({ error: 'fileName required' });

  const hash = genHash(fileName, fileSize || 2621440);
  const watermark = genWatermark();
  const embedding = computeFingerprint(fileName, fileSize || 2621440, scenario || 'normal');
  const assetId = uuidv4();

  const record = {
    assetId,
    hash,
    watermark,
    embedding: embedding.slice(0, 16), // store partial for response size
    fileName,
    fileSize,
    scenario,
    registeredAt: new Date().toISOString(),
    storageRef: `sec://vault/${hash.slice(0, 8)}`,
  };
  fingerprintStore.set(assetId, { ...record, embedding });

  logger.info('Asset registered', { assetId, hash: hash.slice(0, 12) });

  res.json({
    success: true,
    assetId,
    hash,
    watermark,
    embeddingDim: 512,
    embeddingModel: 'ResNet-18 · L2-norm',
    storageRef: record.storageRef,
    registeredAt: record.registeredAt,
  });
});

// ── GET /api/fingerprint/:assetId ────────────────────────────────────────────
router.get('/:assetId', (req, res) => {
  const record = fingerprintStore.get(req.params.assetId);
  if (!record) return res.status(404).json({ error: 'Asset not found' });
  const { embedding: _emb, ...safe } = record;
  res.json({ success: true, asset: safe });
});

// ── POST /api/fingerprint/match ──────────────────────────────────────────────
router.post('/match', (req, res) => {
  const { assetId, scenario } = req.body;
  if (!assetId) return res.status(400).json({ error: 'assetId required' });
  const record = fingerprintStore.get(assetId);
  if (!record) return res.status(404).json({ error: 'Asset not found' });

  // Simulate match scan results
  const scenarios = ['crop', 'deepfake', 'news', 'entertainment', 'manipulated'];
  const targetScenario = scenario || record.scenario || 'normal';
  const simBase = { crop: 0.82, deepfake: 0.76, news: 0.79, entertainment: 0.85, manipulated: 0.71, normal: 0.3 };
  const similarity = simBase[targetScenario] ?? 0.5;

  res.json({
    success: true,
    assetId,
    similarity_score: similarity,
    match_found: similarity > 0.5,
    confidence: similarity * 100,
  });
});

module.exports = router;
