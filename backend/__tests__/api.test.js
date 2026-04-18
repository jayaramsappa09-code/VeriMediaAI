const request = require('supertest');
const app = require('../server');

describe('VeriMedia API', () => {
  describe('GET /api/health', () => {
    it('returns 200 and status ok', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.service).toBe('VeriMedia AI Backend');
    });
  });

  describe('POST /api/fingerprint/register', () => {
    it('registers an asset and returns hash + watermark', async () => {
      const res = await request(app)
        .post('/api/fingerprint/register')
        .send({ fileName: 'test_video.mp4', fileSize: 2621440, scenario: 'crop' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.hash).toBeDefined();
      expect(res.body.watermark).toBeDefined();
      expect(res.body.assetId).toBeDefined();
      expect(res.body.embeddingDim).toBe(512);
    });

    it('returns 400 if fileName missing', async () => {
      const res = await request(app).post('/api/fingerprint/register').send({});
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/analyze (no API key)', () => {
    it('returns 401 without API key', async () => {
      const res = await request(app)
        .post('/api/analyze')
        .send({ scenario: 'crop', matches: [] });
      expect(res.status).toBe(401);
    });

    it('returns 400 for missing scenario', async () => {
      const res = await request(app)
        .post('/api/analyze')
        .set('X-Api-Key', 'test')
        .send({});
      expect(res.status).toBe(400);
    });

    it('returns 400 for invalid scenario', async () => {
      const res = await request(app)
        .post('/api/analyze')
        .set('X-Api-Key', 'test')
        .send({ scenario: 'invalid_scenario' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/report/dmca', () => {
    it('generates a DMCA report', async () => {
      const res = await request(app)
        .post('/api/report/dmca')
        .send({
          platform: 'Instagram',
          user: '@test_user',
          caption: 'Stolen content',
          contentType: 'general',
          analysisData: { match_score: 0.85, integrity_score: 0.2, decision: 'TAKEDOWN', scenario: 'crop' },
        });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.caseId).toMatch(/^VM-/);
      expect(res.body.report).toContain('DMCA Takedown Report');
      expect(res.body.report).toContain('Instagram');
    });

    it('returns 400 without platform', async () => {
      const res = await request(app).post('/api/report/dmca').send({});
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/analyze/viral', () => {
    it('returns viral score for deepfake scenario', async () => {
      const res = await request(app)
        .post('/api/analyze/viral')
        .send({ scenario: 'deepfake', matchCount: 3 });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(typeof res.body.score).toBe('number');
      expect(res.body.score).toBeGreaterThan(0);
    });
  });
});
