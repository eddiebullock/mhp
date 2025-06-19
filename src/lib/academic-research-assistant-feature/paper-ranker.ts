type Paper = {
  studyType: string;
  impactFactor?: number;
  sampleSize?: number;
  year?: number;
  [key: string]: any;
};

export function calculateQualityScore(paper: Paper) {
  let score = 0;
  const studyTypeScores: { [key: string]: number } = {
    'meta-analysis': 10,
    'systematic review': 9,
    'randomized controlled trial': 8,
    'cohort study': 6,
    'case-control study': 5,
    'cross-sectional': 3,
    'case study': 1
  };
  const impactFactorScore = Math.min((paper.impactFactor || 0) * 2, 10);
  const sampleSizeScore = paper.sampleSize && paper.sampleSize > 1000 ? 10 : 
                         paper.sampleSize && paper.sampleSize > 500 ? 8 :
                         paper.sampleSize && paper.sampleSize > 100 ? 6 : 
                         paper.sampleSize && paper.sampleSize > 50 ? 4 : 2;
  const currentYear = new Date().getFullYear();
  const yearsOld = paper.year ? currentYear - paper.year : 0;
  const recencyScore = yearsOld <= 2 ? 10 : 
                      yearsOld <= 5 ? 8 :
                      yearsOld <= 10 ? 6 : 4;
  return {
    overallScore: (studyTypeScores[paper.studyType] + impactFactorScore + sampleSizeScore + recencyScore) / 4,
    breakdown: {
      studyType: studyTypeScores[paper.studyType],
      impactFactor: impactFactorScore,
      sampleSize: sampleSizeScore,
      recency: recencyScore
    }
  };
}

export function rankAndSelectAcademicPapers(papers: Paper[]) {
  const scored = papers.map((p: Paper) => ({ ...p, ...calculateQualityScore(p) }));
  return scored.sort((a, b) => b.overallScore - a.overallScore);
} 