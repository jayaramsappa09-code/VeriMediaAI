function validateAnalysisRequest(req, res, next) {
  const VALID_SCENARIOS = ['crop', 'deepfake', 'news', 'entertainment', 'manipulated', 'insufficient', 'normal', 'adversarial', 'blur', 'education'];
  const { scenario } = req.body;

  if (!scenario) return res.status(400).json({ error: 'scenario is required' });
  if (!VALID_SCENARIOS.includes(scenario)) {
    return res.status(400).json({ error: `Invalid scenario. Must be one of: ${VALID_SCENARIOS.join(', ')}` });
  }

  if (req.body.matches && !Array.isArray(req.body.matches)) {
    return res.status(400).json({ error: 'matches must be an array' });
  }

  next();
}

module.exports = { validateAnalysisRequest };
