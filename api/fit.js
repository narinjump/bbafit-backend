import rules from "./rules/bba_major_fit_engine_v4_3.json";

export default function handler(req, res) {
  try {
    const answers = req.body.answers;
    if (!answers || Object.keys(answers).length !== 30) {
      return res.status(400).json({ error: "Invalid answer set" });
    }

    const avg = (arr) => arr.reduce((a,b)=>a+b,0)/arr.length;

    const LTP = {};
    const BCFM = {};

    for (const [k,qids] of Object.entries(rules.dimensions.LTP)) {
      LTP[k] = avg(qids.map(i=>Number(answers[i])));
    }
    for (const [k,qids] of Object.entries(rules.dimensions.BCFM)) {
      BCFM[k] = avg(qids.map(i=>Number(answers[i])));
    }

    const ranking = [];
    for (const [major,w] of Object.entries(rules.weights)) {
      let score = 0;
      for (const dim in w) score += w[dim] * BCFM[dim];
      ranking.push({ major, score:Number(score.toFixed(2)) });
    }

    ranking.sort((a,b)=>b.score-a.score);

    const insights = [];
    for (const k in rules.insights) {
      const v = LTP[k] ?? BCFM[k];
      if (v>=4) insights.push({ dimension:k, level:"high", text:rules.insights[k].high });
      if (v<=2) insights.push({ dimension:k, level:"low", text:rules.insights[k].low });
    }

    res.status(200).json({
      primary_major: ranking[0],
      secondary_major: ranking[1],
      learning_profile: LTP,
      career_dna: BCFM,
      all_ranking: ranking,
      insights: insights
    });

  } catch (e) {
    res.status(500).json({ error: "engine_failure" });
  }
}
