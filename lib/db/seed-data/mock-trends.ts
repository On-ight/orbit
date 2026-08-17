// Raw seed data standing in for a live trend feed. The Trend Agent
// summarizes these; the Content Agent then drafts a post from the summary.

export interface SeedTrend {
  topic: string;
  rawSignal: string;
}

export const SEED_TRENDS: SeedTrend[] = [
  {
    topic: "Delhi metro expansion",
    rawSignal:
      "Delhi metro just opened a new line connecting the airport to the old city faster than ever — first-time visitors keep asking how to use it.",
  },
  {
    topic: "India visa-on-arrival changes",
    rawSignal:
      "Several travel forums report the e-visa process got faster this month, with approval times dropping from days to hours for many nationalities.",
  },
  {
    topic: "Monsoon season travel spike",
    rawSignal:
      "Search interest for 'India monsoon travel tips' is climbing as travelers plan around the season instead of avoiding it entirely.",
  },
];
