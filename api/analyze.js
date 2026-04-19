module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const { brand } = req.body || {};
  if (!brand) return res.status(400).json({ error: "Missing brand" });

  const SYSTEM = `You are a senior merchandise strategist at Bloomingdale's evaluating brands for portfolio inclusion.

Two dimensions: Category Growth Rate (1-10) and Emerging Consumer Appeal (1-10).
Quadrants: Q1 Priority (both 6+), Q2 Secondary (growth 6+, appeal <6), Q4 Watch (appeal 6+, growth <6), Q3 Monitor (both <6).

If the brand is already carried at Bloomingdale's, set alreadyCarried true and verdictType to "carried".

Respond ONLY with valid JSON. No markdown, no backticks, no preamble.
{
  "brandName": "Official name",
  "category": "Primary category",
  "categoryGrowthScore": 7,
  "consumerAppealScore": 8,
  "estimatedYoY": "~14% YoY",
  "quadrant": "Q1 — Priority",
  "verdictLabel": "Priority Acquisition Target",
  "verdictType": "priority",
  "signals": ["Signal 1","Signal 2","Signal 3","Signal 4"],
  "profile": "2-3 sentence brand profile.",
  "bloomingdalesFit": "2-3 sentences on fit with Bloomingdale's.",
  "recommendation": "1-2 sentence executive recommendation.",
  "validationNotes": "Distribution, retail partners, flags.",
  "matrixX": 0.78,
  "matrixY": 0.62,
  "alreadyCarried": false
}
matrixX: 0-1 (0=low appeal, 1=high). matrixY: 0-1 (0=low growth, 1=high).
verdictType: priority|secondary|watch|monitor|carried.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: SYSTEM,
        messages: [{ role: "user", content: "Analyze for Bloomingdale's merchandise strategy: " + brand }]
      })
    });

    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message });

    const text = data.content?.map(b => b.text || "").join("") || "";
    const clean = text.replace(/```json|```/g, "").trim();
    const result = JSON.parse(clean);
    return res.status(200).json(result);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
