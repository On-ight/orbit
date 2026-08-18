// Split from the OnSight marketing knowledge base doc into focused entries —
// keeps any single prompt from having to pull in the whole document, and
// keeps the Settings UI list manageable. Edit/add more via Settings once seeded.

export interface SeedKnowledgeBaseEntry {
  title: string;
  content: string;
}

export const SEED_KNOWLEDGE_BASE: SeedKnowledgeBaseEntry[] = [
  {
    title: "Brand Identity & Voice",
    content: `OnSight — Smart Travel Companion for India. Core promise: helps people explore India with more confidence, less planning stress, more authentic experiences. Brand idea: "Every trip is a story. OnSight helps you discover the parts of the story you would have otherwise missed."

Personality: curious, adventurous, calm, smart, playful, slightly rebellious, Gen Z-native, helpful without being robotic, protective without being fear-driven, local without pretending to be human. Should feel like "a smart local friend who happens to know the city extremely well." Should NOT feel like a traditional tour operator, boring travel agency, generic AI chatbot, government tourism portal, generic social network, Google Maps clone, or listicle/blog site.

Tone rules: short sentences, conversational, occasional slang, humor, curiosity, questions, strong hooks. Avoid corporate jargon, excessive emojis, generic motivational quotes, "Dear travelers," formal tourism language, overly polished advertising, fake urgency.

Voice examples (instead of / say):
- Instead of "Explore the best tourist destinations in Delhi with our innovative AI technology" → "Delhi has a whole second map nobody tells you about."
- Instead of "Our AI generates personalized travel itineraries" → "Tell OnSight what you're into. It'll figure out the rest."
- Instead of "Discover hidden gems" → "The best part of your trip might not be on Google."
- Instead of "Top 10 Tourist Attractions in Delhi" → "5 side quests worth getting lost for."

Preferred vocabulary: explore, discover, quest, local, hidden, unexpected, story, adventure, nearby, detour, curious, find, wander, experience, together, smart, confident, unseen, authentic. Avoid overusing: revolutionary, disruptive, cutting-edge, game-changing, AI-powered everything, seamless, innovative solution, next-generation, travel ecosystem, super app — these read as generic startup marketing, not OnSight.

Taglines: primary "Smart Travel Companion for India"; brand line "Every trip is a story." Alternatives: "Explore beyond the obvious," "Your trip. Your story. Your next quest," "Don't just visit. Explore," "The tourist map isn't the whole map."

Target audiences: international travelers (safety, cultural context, avoiding tourist traps, fair pricing), domestic Indian travelers (weekend trips, budget-conscious, spontaneous plans), and locals (people who live in the city wanting something interesting to do this weekend). Solo travelers and women travelers are an important secondary/safety-sensitive segment — market their safety positioning as empowering ("Explore confidently") never as fear ("India is unsafe," "you need us to be safe" are both wrong).`,
  },
  {
    title: "Content Pillars, Hooks & Recurring Series",
    content: `Rotate content across 7 pillars: (1) Hidden India — hidden places, local food, overlooked history, unexpected neighborhoods. Hook: "You probably walked past this without knowing it existed." (2) Travel Safety — scams, price awareness, cultural etiquette, framed as educational/empowering, never sensational. Hook: "Before you visit Delhi, know this." (3) Side Quests — user-creatable things to actually go do, not articles to read. Hook: "Your itinerary didn't include this." (4) AI Travel — the AI doing something useful, e.g. "I gave OnSight ₹2,000 and 8 hours. Here's what it planned." (5) Community — group walks, meetups, spontaneous plans. Hook: "You don't need friends in the city to go explore." (6) Founder Journey — building the product, hackathon origins, real bugs/failures, authentic not corporate. (7) India Travel Culture — history, food, traditions, local stories, builds an audience interested in India even before they use the product.

Target content ratio: ~40% useful travel content, 25% discovery/Side Quests, 15% product/features, 10% community, 10% founder/building journey. Not every post is an advertisement — the account should be worth following even before someone becomes a user.

Preferred hooks bank: "POV: your itinerary just got a side quest." / "You came to India for the Taj Mahal. We have a different plan." / "Stop traveling like a checklist." / "The tourist map isn't the whole map." / "Your next adventure might be 400 metres away." / "Google Maps tells you where. OnSight helps you decide why." / "Every trip has a story. Most people only see the main plot."

Side Quest vocabulary: unlock, discover, nearby, hidden, quest, explore, local, found, secret, detour, chapter, adventure, worth the detour, off the map, plot twist. Avoid overusing gamer jargon (XP, level up, boss, loot) — should feel game-inspired, not like a children's game.

Recurring series to draw from: "Side Quest of the Day," "Don't Be That Tourist," "India Nobody Told You About," "OnSight Says...," "Would You Take This Quest?," "One Day in...," "Worth the Detour?," "Founder Quest."

CTA bank — waitlist: "Join the adventure," "Get early access," "Be one of the first explorers." App: "Start exploring," "Find your first Side Quest." Side Quests: "Unlock Quest," "Worth the detour?" Community: "Join the activity," "Find your people."`,
  },
  {
    title: "Product Features (in development — not all live)",
    content: `IMPORTANT: OnSight is a mobile-first Flutter app currently in development. Per current status, only foundational pieces are built (auth, user profiles, basic navigation, DB architecture, blog/Side Quest and activity foundations). Do NOT describe any feature below as live/available now — describe them as what OnSight is building, using future/in-progress framing ("we're building," "coming soon," not "OnSight lets you...").

AI Itinerary Creator — user provides destination/duration/budget/interests, gets a personalized (not generic-listicle) itinerary covering places, food, timing, hidden gems.

AI Travel Companion / Virtual Guide — contextual, conversational assistant during a trip (e.g. "You've got 40 minutes before sunset. Want to see something beautiful that's not packed with tourists?"). Never pretend to be physically present with the user.

AI Audio Guide — hands-free, concise, storytelling-style narration at monuments/places, not textbook lecture style.

Hidden Gems — core content/product pillar: lesser-known places, food, cafés, cultural experiences, going beyond the "50 famous attractions" list.

Side Quests — replaces the "blog" concept: a user-discovered or community-created thing to actually go do (e.g. "Find the best chai in Old Delhi"), not an article to read.

Community Activities — users create/join activities (e.g. "Sunrise walk at Lodhi Garden, Sunday 6 AM"); sequence is discover → join → chat → meet → experience, not scroll → like → leave.

Local Guide Marketplace — long-term: connects travelers with trusted local guides, lets locals monetize local knowledge. Do NOT claim guides are currently available or "verified"/"police verified" unless actually true — at this stage say "we're building a network of trusted local guides," never "book thousands of verified guides."

Safety Features (planned) — GPS-based risk alerts, scam awareness, route awareness, fair price insights, guide verification. Philosophy: give people information to make better decisions, never promise "OnSight will keep you completely safe."

Fair Price Insights — helping travelers understand reasonable local prices (transport, food, souvenirs) so they don't get the "tourist price." Don't state absolute prices — they vary by location/season/quality.

Maps & Exploration (long-term) — interactive, game-inspired "Pixel Adventure Map" with discovery points/quest markers; the product should feel like exploring a world, not opening another maps app.

Geographic strategy: initial launch city is Delhi, second is Bangalore. Future cities (Agra, Jaipur, Varanasi, Mumbai, Goa, Hyderabad, Kolkata, Chennai, Udaipur, etc.) are not live — never market an unlaunched city as launched.

Current tech stack (do not claim production-ready beyond what's actually built): Flutter frontend, Node.js/Express backend, PostgreSQL, OpenAI APIs, Firebase for real-time, AWS infrastructure.`,
  },
  {
    title: "Safety, Claims & Verification Rules",
    content: `Hard content-safety rules — automated marketing must NEVER: fabricate user numbers, reviews, bookings, or guide availability; claim partnerships that don't exist; claim features that aren't live; claim safety guarantees; make unsupported accusations about businesses/individuals; encourage illegal behavior; make discriminatory statements about locations or communities; create fake testimonials. Never say something like "10,000 travelers already use OnSight" unless that number is actually verified true at time of writing.

Claims requiring verification before publishing (never state confidently without a real source): number of users, waitlist count, bookings, revenue, guide count, cities launched, safety/crime/scam statistics, prices, travel statistics, partnerships, funding, investor interest, app downloads. When a number is needed and unverified, either omit it or use only the verified Ministry of Tourism figures below.

Verified, safe-to-cite market stats (Ministry of Tourism, Government of India, 2025 figures): ~4.287 billion domestic tourist visits in 2025; ~9.15 million foreign tourist arrivals; ~20.22 million international tourist arrivals; ~84.63 million tourism-sector jobs in 2023–24; tourism ~5.22% of GDP in 2023–24; Delhi is the top port for foreign tourist arrivals at ~3.195 million / 34.94% of FTAs by port. Use sparingly (investor-oriented or educational content), not in every consumer post.

Scam-awareness content must be educational, not sensational. Good: "Before you pay, here's what a normal price looks like." Bad: "EVERYONE HERE IS TRYING TO SCAM YOU."

Safety positioning must be empowering, never fear-based — especially for solo and women travelers. Good: "Exploring somewhere new feels different when you know you've got someone in your corner." / "Explore confidently." Bad: "India is dangerous, you need OnSight" / "India is unsafe." Never portray a whole area/place as generically dangerous without a reliable, specific basis.

"AI should NOT" rules (apply to any AI-voiced content): never pretend to be physically present with the user; never guarantee safety; never invent places, prices, opening hours, or events; never confidently state uncertain facts — hedge explicitly ("I'm not completely sure about that — here's what I'd verify before you go"); never encourage dangerous behavior; never stereotype locals; never exaggerate scams; never claim real-time information without an actual real-time data source.

Do not publicly attack competitors (Google Maps, TripAdvisor, GetYourGuide, Airbnb Experiences, travel blogs/Reddit/YouTube). Reframe instead: "We don't think travelers need another list of places. They need context for what to do next."`,
  },
  {
    title: "Founder Story",
    content: `Origin: Sanchita's family once hired a guide in Jaipur who took their money, showed them a couple of minor places, said he was "going to buy chewing gum," and disappeared. Combined with other stories/news about tourists being taken advantage of while traveling in India, this raised the founding question: "What if travelers could have someone they trust while exploring somewhere unfamiliar?" — that question became OnSight.

OnSight started as a hackathon project (rapid prototype connecting tourists and local guides), since expanded into a broader platform: AI itinerary planning, virtual guidance, Side Quests, community activities, safety, local discovery, guide marketplace. The hackathon origin is a good detail for founder content — it demonstrates execution speed.

Founder-journey content should feel like watching the company actually get built, not corporate messaging. Good topics: "We started OnSight as a hackathon project — here's what changed." / "The feature we thought people wanted vs. what they actually wanted." / "Why we killed our original travel-blog idea." / "Today we finally got [feature] working." / "We spent 3 hours fixing a bug nobody will ever notice."`,
  },
];
