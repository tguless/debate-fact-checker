export const FIREHOSE_PHRASES = [
  "all true",
  "everybody knows",
  "everyone knows",
  "you can look it up",
  "not allowed to notice",
  "not allowed to say",
  "they don't want you to",
  "the media won't tell you",
  "obvious to anyone",
  "anyone paying attention",
  "diversity is our strength",
];

export const PREEMPTIVE_CLOSURE = [
  "all true",
  "that's true",
  "this is true",
  "fact",
  "proven",
  "undeniable",
  "no question",
];

export const CAUSAL_LEAP_MARKERS = [
  "because of",
  "because they",
  "that's why",
  "which is why",
  "intentional",
  "deliberate",
  "on purpose",
  "almost like it's",
  "of course it is",
  "sends a message",
  "designed to",
  "meant to",
  "policy to",
  "war on",
  "replacing",
  "replacement",
];

export const STATISTIC_PATTERNS = [
  /\b\d{1,3}(?:\.\d+)?%/g,
  /\b\d+\s*(?:out of|for every|per)\s*\d+/gi,
  /\b(?:one|1)\s+(?:white|native|american|british).{0,40}(?:per|for every)\s*\d+/gi,
  /\b(?:half|majority|most|all|90%|80%|70%|99%)\s+of\b/gi,
  /\b(?:million|billion|thousand)\s+(?:people|jobs|births|immigrants)\b/gi,
];

export const STRAWMAN_PATTERNS = [
  /\b(?:called|said|labeled)\s+(?:you|us|them|concerned people).{0,40}(?:nazi|fascist|racist)\b/gi,
  /\bthe media (?:says|said|claims|called)\b/gi,
  /\b(?:they|the left|the elites) (?:want|wanted|say) you to\b/gi,
];

export const VERIFIABLE_ASSERTION_STARTERS = [
  /\b(?:studies show|data shows|statistics show|according to|research shows)\b/gi,
  /\b(?:in \d{4}|over the last \d+ years|since \d{4})\b/gi,
  /\b(?:the rate|the number|the percentage|unemployment|birth rate|death rate)\b/gi,
];

export const TOPIC_SHIFT_MARKERS = [
  /\b(?:now|but|however|meanwhile|speaking of|let's talk about|turning to|in america|in britain|in the uk|in europe)\b/gi,
];

export const GISH_GALLOP_PHASES = [
  { phase: "Hook", description: "Emotional anchor — tragedy, footage, or outrage story" },
  { phase: "Leap", description: "Local event converted into civilizational claim" },
  { phase: "Gallop", description: "Rapid statistics and assertions without sourcing pause" },
  { phase: "Villains", description: "Elites, media, or policy blamed as intentional actors" },
  { phase: "Parallel", description: "Second geography or issue fused to amplify grievance" },
  { phase: "Doom", description: "Democracy, civilization, or future framed as collapsing" },
  { phase: "Relief", description: "Interview, hope, or product that presupposes prior claims" },
];

export const PHASE_SIGNALS: Record<string, RegExp[]> = {
  Hook: [
    /\b(?:murder|murdered|killed|died|stabbed|shooting|bodycam|footage|tragedy|victim)\b/i,
  ],
  Leap: [
    /\b(?:worth less|white lives|civilization|civilizational|not allowed to notice|cosmolog)\b/i,
    /\b(?:proves|proof that|this is what|this shows)\b/i,
  ],
  Gallop: [
    /\b\d{1,3}(?:\.\d+)?%/,
    /\b(?:studies show|data shows|statistics show|according to|research shows)\b/i,
    /\b(?:half|majority|90%|80%|for every \d+)\b/i,
  ],
  Villains: [
    /\b(?:elite|elites|media|khan|government|regime|they want|diversity religion)\b/i,
    /\b(?:sadiq|liberal|leftist|woke)\b/i,
  ],
  Parallel: [
    /\b(?:in america|in the us|in britain|in the uk|in europe|same thing|just like)\b/i,
    /\b(?:george floyd|united states|across the west)\b/i,
  ],
  Doom: [
    /\b(?:democracy|dying|civil war|revolution|collapse|totalitarian|end of)\b/i,
    /\b(?:no future|beyond repair|godless)\b/i,
  ],
  Relief: [
    /\b(?:interview|my guest|joining us|hope|solution|church|faith|advertisement)\b/i,
    /\b(?:frank wright|let's talk to|speaking with)\b/i,
  ],
};
