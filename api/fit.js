import rules from "../rules/bba_major_fit_engine_v4_3.json";

export default function handler(req, res) {
  try {
    const answers = req.body.answers;
    if (!answers || answers.length !== 30) {
      return res.status(400).json({ error: "answers must be 30 values" });
    }

    const LTP = {};
    const BCFM = {};

    for (const [k, qids] of Object.entries(rules.dimensions.LTP)) {
      LTP[k] = avg(qids.map(i => answers[i-1]));
    }
    for (const [k, qids] of Object.entries(rules.dimensions.BCFM)) {
      BCFM[k] = avg(qids.map(i => answers[i-1]));
    }

    const ranking = {};
    for (const [major, w] of Object.entries(rules.weights)) {
      ranking[major] =
        BCFM.Structure_Work * w.Structure_Work +
        BCFM.Data_Logic * w.Data_Logic +
        BCFM.People_Engagement * w.People_Engagement +
        BCFM.Resilience * w.Resilience;
    }

    const sorted = Object.entries(ranking)
      .sort((a,b)=>b[1]-a[1])
      .map(([major,score])=>({major,score:score.toFixed(2)}));

    const insights = {};
    for (const [k,v] of Object.entries(rules.insights)) {
      const val = LTP[k] ?? BCFM[k];
      insights[k] = val>=4 ? v.high : v.low;
    }

    res.json({
      LTP,
      BCFM,
      ranking: sorted,
      insights
    });

  } catch(e) {
    res.status(500).json({error:e.message});
  }
}

function avg(arr){
  return +(arr.reduce((a,b)=>a+b,0)/arr.length).toFixed(2);
}
