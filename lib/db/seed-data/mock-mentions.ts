// Raw seed data standing in for real X mentions/timeline, until live API
// access exists. Intentionally NOT pre-classified — intent/riskTier/drafts
// are assigned by the Community Agent the first time "Run agent cycle" runs.

export interface SeedMention {
  authorHandle: string;
  authorName: string;
  text: string;
  likes: number;
  replyCount: number;
  daysAgo: number;
}

export const SEED_MENTIONS: SeedMention[] = [
  // High-intent, low-risk — clear buying/travel-planning signal
  {
    authorHandle: "alextravels",
    authorName: "Alex",
    text: "Planning my first India trip. Is Delhi worth spending 4 days in?",
    likes: 128,
    replyCount: 23,
    daysAgo: 0,
  },
  {
    authorHandle: "traveler123",
    authorName: "Jordan",
    text: "Going to Delhi alone next month. Any advice?",
    likes: 41,
    replyCount: 9,
    daysAgo: 0,
  },
  {
    authorHandle: "priya_wanders",
    authorName: "Priya",
    text: "How much does the OnSight Pro plan cost? Been using the free tier for weeks and I'm ready to upgrade.",
    likes: 19,
    replyCount: 3,
    daysAgo: 1,
  },
  {
    authorHandle: "backpack_mo",
    authorName: "Mo",
    text: "First time in India next week — Mumbai then Goa. Any must-do apps or tools before I land?",
    likes: 76,
    replyCount: 14,
    daysAgo: 1,
  },

  // Medium-intent — general engagement, comparison shopping
  {
    authorHandle: "wanderlust_kim",
    authorName: "Kim",
    text: "How does OnSight compare to just using a regular travel guidebook?",
    likes: 22,
    replyCount: 6,
    daysAgo: 1,
  },
  {
    authorHandle: "solo_sam",
    authorName: "Sam",
    text: "Curious if OnSight covers train travel between cities or just city guides.",
    likes: 15,
    replyCount: 2,
    daysAgo: 2,
  },
  {
    authorHandle: "gapyear_dana",
    authorName: "Dana",
    text: "Anyone actually used OnSight for a real trip? Wondering if it's worth the download.",
    likes: 34,
    replyCount: 8,
    daysAgo: 2,
  },
  {
    authorHandle: "nomad_theo",
    authorName: "Theo",
    text: "India's been on my list for years. What's the best time of year to go?",
    likes: 51,
    replyCount: 11,
    daysAgo: 2,
  },

  // Low-intent / noise
  {
    authorHandle: "randomuser882",
    authorName: "randomuser882",
    text: "lol",
    likes: 0,
    replyCount: 0,
    daysAgo: 3,
  },
  {
    authorHandle: "cryptobot_promo",
    authorName: "CryptoGains",
    text: "Check out my profile for guaranteed returns!! link in bio",
    likes: 2,
    replyCount: 0,
    daysAgo: 3,
  },
  {
    authorHandle: "unrelated_fan",
    authorName: "Unrelated Fan",
    text: "great weather today",
    likes: 3,
    replyCount: 1,
    daysAgo: 3,
  },

  // Complaint / accusation — must be NEVER-tier, no auto-draft
  {
    authorHandle: "angry_traveler99",
    authorName: "Frustrated User",
    text: "OnSight charged me twice for the same subscription and support won't respond. Feels like a scam at this point.",
    likes: 88,
    replyCount: 31,
    daysAgo: 4,
  },
  {
    authorHandle: "refund_pls",
    authorName: "Nina",
    text: "This app ripped me off. Cancelled a month ago and still being billed. Considering a chargeback.",
    likes: 45,
    replyCount: 17,
    daysAgo: 4,
  },

  // Political / controversial-adjacent — must be caught by keyword pre-filter
  {
    authorHandle: "policy_watcher",
    authorName: "Policy Watcher",
    text: "Given the new immigration policy changes, does OnSight's visa guidance still apply or is it outdated?",
    likes: 12,
    replyCount: 4,
    daysAgo: 5,
  },
  {
    authorHandle: "current_events_fan",
    authorName: "News Follower",
    text: "With the election coverage everywhere, is anyone even still traveling right now lol",
    likes: 6,
    replyCount: 2,
    daysAgo: 5,
  },

  // Unverified safety claims — must not get an auto-draft
  {
    authorHandle: "worried_parent",
    authorName: "Worried Parent",
    text: "Heard someone got hospitalized after following an OnSight recommended route, is that true?? Very concerning.",
    likes: 63,
    replyCount: 22,
    daysAgo: 6,
  },
  {
    authorHandle: "safety_first_22",
    authorName: "SafetyFirst",
    text: "Is it true there was a data leak and OnSight got hacked? Seeing this floating around.",
    likes: 29,
    replyCount: 10,
    daysAgo: 6,
  },

  // Potential customer / partnership-shaped
  {
    authorHandle: "travel_blogger_zoe",
    authorName: "Zoe",
    text: "Would love to partner with OnSight for a India travel series on my channel — who do I talk to?",
    likes: 58,
    replyCount: 13,
    daysAgo: 7,
  },
  {
    authorHandle: "hostel_owner_raj",
    authorName: "Raj",
    text: "Run a hostel chain across Rajasthan, interested in getting listed as a recommended stay on OnSight.",
    likes: 20,
    replyCount: 5,
    daysAgo: 7,
  },
];
