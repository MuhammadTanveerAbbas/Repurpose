export type InputMode = "idea" | "transcript" | "youtube" | "pain_point";

export type ContentFormat =
  | "LinkedIn Post"
  | "LinkedIn Hook"
  | "Twitter/X Thread"
  | "Short-form Video Script"
  | "Cold Email Draft"
  | "Newsletter Section"
  | "YouTube Description"
  | "Instagram Caption"
  | "Personal Brand Bio Update";

export interface ContentStrategy {
  core_message: string;
  audience: string;
  recommended_formats: ContentFormat[];
  tone: string;
  strategy_note: string;
  hook_ideas: string[];
  content_pillars: string[];
  emotional_triggers: string[];
}

export interface GeneratedOutput {
  format: ContentFormat;
  content: string;
  done: boolean;
}

export const ALL_FORMATS: ContentFormat[] = [
  "LinkedIn Post",
  "LinkedIn Hook",
  "Twitter/X Thread",
  "Short-form Video Script",
  "Cold Email Draft",
  "Newsletter Section",
  "YouTube Description",
  "Instagram Caption",
  "Personal Brand Bio Update",
];

export const FORMAT_CHAR_LIMITS: Partial<Record<ContentFormat, number>> = {
  "LinkedIn Post": 3000,
  "LinkedIn Hook": 300,
  "Twitter/X Thread": 2240,
  "Short-form Video Script": 1500,
  "Cold Email Draft": 600,
  "Newsletter Section": 1200,
  "YouTube Description": 5000,
  "Instagram Caption": 2200,
  "Personal Brand Bio Update": 400,
};

export const FORMAT_ICONS: Record<ContentFormat, string> = {
  "LinkedIn Post": "💼",
  "LinkedIn Hook": "🪝",
  "Twitter/X Thread": "🐦",
  "Short-form Video Script": "🎬",
  "Cold Email Draft": "📧",
  "Newsletter Section": "📰",
  "YouTube Description": "▶️",
  "Instagram Caption": "📸",
  "Personal Brand Bio Update": "👤",
};

export const FORMAT_PLATFORM_TIPS: Record<ContentFormat, string> = {
  "LinkedIn Post": "Best posted Tue-Thu 8-10am local time. First 3 lines visible without 'see more' — lead with tension.",
  "LinkedIn Hook": "Use as the opening of a longer post. Pair with a strong visual for highest CTR.",
  "Twitter/X Thread": "Post tweet 1 as a standalone thread starter. Engage replies before posting remaining tweets.",
  "Short-form Video Script": "TikTok: fast cuts, trending audio. Reels: aesthetic, slow burn. Shorts: direct, informational.",
  "Cold Email Draft": "Send Tue-Thu morning. Follow up day 3 and day 7. Keep each email under 125 words.",
  "Newsletter Section": "Use as one section of a 3-5 section newsletter. Open rate peaks 6-8am.",
  "YouTube Description": "First 2 lines are 'above the fold' — front-load keywords and hook.",
  "Instagram Caption": "Post with 3-5 carousel slides or a Reel. First line is the only visible line — make it count.",
  "Personal Brand Bio Update": "Use across LinkedIn, Twitter, website, and email signature. Keep consistent.",
};

const getAccessToken = async (): Promise<string> => {
  const { supabase } = await import("@/integrations/supabase/client");
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? "";
};

export const callGroq = async (
  systemPrompt: string,
  userMessage: string,
): Promise<string> => {
  const token = await getAccessToken();

  const response = await fetch("/api/groq", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.75,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error ?? `AI service error (${response.status})`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content ?? "";
};

const STRATEGY_SYSTEM_PROMPT = `You are a world-class content strategist. Your job is to deeply analyze the user's input and produce a precise, actionable content strategy.

Analyze and return:
1. core_message: The single most compelling message in 10 words or fewer. This is your title.
2. audience: Exactly who this is for — be specific (e.g. "B2B SaaS founders doing $50k-500k ARR who are tired of complex sales")
3. recommended_formats: Pick 3-5 formats from the list that will perform BEST for this specific input. Consider: platform distribution, audience consumption habits, content type fit.
4. tone: One of: Direct, Story-driven, Educational, Provocative, Conversational, Inspirational, Contrarian, or Data-driven
5. strategy_note: A one-sentence growth strategy. E.g. "Lead with the contrarian take on Twitter, expand into a LinkedIn story post, then repurpose the narrative into a short-form video for TikTok."
6. hook_ideas: 3 specific hook phrases or opening lines optimized for this content
7. content_pillars: 2-3 broader themes this content connects to (for content batching/repurposing)
8. emotional_triggers: The 2-3 emotions this content activates (e.g. "FOMO, Curiosity, Aspiration")

Content format options:
- LinkedIn Post (long-form, thought leadership, 150-300 words)
- LinkedIn Hook (punchy opener only, 3 lines max)
- Twitter/X Thread (5-8 tweets with numbering)
- Short-form Video Script (hook + body + CTA, under 60 seconds)
- Cold Email Draft (subject line + 4-line email body)
- Newsletter Section (intro + 3 key points + CTA)
- YouTube Description (SEO-optimized, with timestamps placeholder)
- Instagram Caption (punchy, emoji-light, hashtag block)
- Personal Brand Bio Update (third-person, 3 sentences)

Return ONLY valid JSON in this exact shape (NO markdown, NO backticks):
{
  "core_message": "string",
  "audience": "string",
  "recommended_formats": ["format1", "format2", "format3"],
  "tone": "string",
  "strategy_note": "string",
  "hook_ideas": ["hook1", "hook2", "hook3"],
  "content_pillars": ["pillar1", "pillar2"],
  "emotional_triggers": ["trigger1", "trigger2"]
}`;

export const analyzeContent = async (
  input: string,
  mode: InputMode,
): Promise<ContentStrategy> => {
  const modeContext = {
    idea: "The user has a raw idea or thought they want turned into content.",
    transcript: "The user has a full transcript (podcast, video, speech) to repurpose into multiple formats.",
    youtube: "The user has a YouTube video to repurpose into other content formats.",
    pain_point: "The user has a specific pain point or problem they want to address with content.",
  };

  const userMessage = `Input mode: ${mode} — ${modeContext[mode]}\n\nContent:\n${input}\n\nAnalyze this ${mode === "youtube" ? "video content" : mode === "transcript" ? "transcript" : mode === "pain_point" ? "pain point" : "idea"} and produce a complete content strategy as JSON.`;

  const raw = await callGroq(STRATEGY_SYSTEM_PROMPT, userMessage);

  const tryParse = (text: string): ContentStrategy | null => {
    try {
      const cleaned = text
        .replace(/```json\s*/gi, "")
        .replace(/```\s*/g, "")
        .trim();
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (!match) return null;
      const parsed = JSON.parse(match[0]) as ContentStrategy;
      if (!parsed.core_message || !parsed.audience || !parsed.recommended_formats) return null;
      return {
        ...parsed,
        hook_ideas: parsed.hook_ideas ?? [],
        content_pillars: parsed.content_pillars ?? [],
        emotional_triggers: parsed.emotional_triggers ?? [],
      };
    } catch {
      return null;
    }
  };

  let result = tryParse(raw);
  if (!result) {
    const retry = await callGroq(`${STRATEGY_SYSTEM_PROMPT}\n\nIMPORTANT: Return ONLY valid JSON. No explanation, no markdown.`, userMessage);
    result = tryParse(retry);
  }

  if (!result) {
    throw new Error(
      "Couldn't parse the strategy response. The AI might be overloaded — try again.",
    );
  }

  return result;
};

const getFormatPrompt = (
  format: ContentFormat,
  strategy: ContentStrategy,
): string => {
  const { core_message, audience, tone } = strategy;
  const hooks = strategy.hook_ideas?.length ? strategy.hook_ideas.join(" | ") : "";

  const prompts: Record<ContentFormat, string> = {
    "LinkedIn Post": `You are a top 1% LinkedIn ghostwriter. Write a LinkedIn post that stops the scroll, generates discussion, and positions the author as an authority.

FORMAT RULES:
- First 3 lines (visible without clicking "see more") must create a curiosity gap or tension
- Short paragraphs: 1-2 sentences max. White space is your friend.
- Lead with a HOOK (bold claim, surprising stat, vulnerable admission, or contrarian take)
- Body: story or framework. Use the "Before → After → Bridge" structure or "Problem → Insight → Solution"
- End with a discussion-starting question or poll-style CTA (drives comments = boosts reach)
- NO hashtags in body. Add 3-5 relevant hashtags at the very end.
- Target 150-300 words. Every sentence must either inform, provoke, or inspire.
- Use the word "you" more than "I" — make it about the reader.

TONE: ${tone}
TOPIC: ${core_message}
AUDIENCE: ${audience}
HOOK IDEAS: ${hooks}

Write the full post now.`,

    "LinkedIn Hook": `You are a direct-response copywriter specializing in LinkedIn hooks.

RULES:
- Write EXACTLY 3 lines. No more, no less.
- Line 1: Pattern interrupt — something unexpected that breaks the reader's scroll
- Line 2: Curiosity gap — hint at something valuable without revealing it
- Line 3: Transition — make them want to click "see more"
- NO emojis in the hook. NO hashtags. NO "I'm excited to share" or "I'm thrilled to announce"
- Every word must earn its place. Cut every adverb, adjective, and filler word.
- Techniques: Bold claim, counter-intuitive observation, vulnerable admission, specific number, or relatable frustration

TONE: ${tone}
TOPIC: ${core_message}
AUDIENCE: ${audience}`,

    "Twitter/X Thread": `You are a Twitter/X growth strategist. Write a thread that gets saved, shared, and drives profile visits.

THREAD ARCHITECTURE:
- Tweet 1 (the hook): Bold, specific, and makes someone stop scrolling. Must create a "I need to know more" feeling. Under 240 chars.
- Tweets 2-4 (the expand): Build the argument step by step. Each tweet should make the previous one more valuable.
- Tweet 5-6 (the proof): Case studies, data points, personal examples, or counter-arguments.
- Tweet 7 (the CTA/closer): Summarize the takeaway, include a clear CTA (follow, retweet, reply), and end with a mic-drop.
- Every tweet must be under 280 characters (aim for 240 to allow quoting)
- Number each tweet: "1/", "2/", etc.
- Line breaks within tweets are OK but keep it punchy
- No hashtags. No emoji spam (1-2 max per thread).

TONE: ${tone}
TOPIC: ${core_message}
AUDIENCE: ${audience}
HOOK IDEAS: ${hooks}

Write the complete thread now.`,

    "Short-form Video Script": `You are a viral short-form video scriptwriter. Write a script optimized for TikTok/Reels/Shorts that maximizes retention.

THE 60-SECOND RETENTION FORMULA:
- 0-3 seconds (the HOOK): Grab attention. Use a visual pattern interrupt, a bold statement, a question, or a surprising fact. MUST make someone stop scrolling.
- 3-10 seconds (the PROBLEM/STAKES): Frame the problem or opportunity. Make them feel "this is exactly what I needed."
- 10-40 seconds (the VALUE): Deliver the insight, framework, or story. Use concrete examples, not abstract advice.
- 40-55 seconds (the PAYOFF): The transformation, the result, the "here's what to do."
- 55-60 seconds (the CTA): Like, follow, save, comment, or share. Be specific about WHY they should do it.

WRITING RULES:
- Write for spoken word — conversational, punchy, natural. Read it aloud to test flow.
- Include [VISUAL: description] cues for video editors (e.g. "[VISUAL: split screen before/after]")
- Include [PAUSE] for dramatic timing
- Include [TEXT OVERLAY: key phrase] for retention hooks
- NO corporate language. NO buzzwords. Sound like a smart friend explaining something cool.
- Every 5-7 seconds, change the visual or audio dynamic to prevent drop-off.

TONE: ${tone}
TOPIC: ${core_message}
AUDIENCE: ${audience}`,

    "Cold Email Draft": `You are a cold email conversion copywriter. Write an email that gets replies, not deleted.

THE 4-SENTENCE FORMULA:
1. OPENER (1 line): Personalize with a specific detail about them. Show you did your research. Not "I love your content" — that's spam.
2. VALUE (1 line): State what you can do for them in ONE concrete sentence. Be specific with numbers or outcomes.
3. ASK (1 line): Make one clear, low-friction request. "Worth a 5-min chat?" or "Reply 'yes' and I'll send the breakdown."
4. SOCIAL PROOF / PS (1 line): Add a credential, result, or mutual connection reference that builds trust.

SUBJECT LINE RULES:
- Under 8 words
- No clickbait patterns (RE:, FWD:, "quick question")
- Personal, specific, and intriguing
- Examples: "[Mutual connection] mentioned you'd be great for this" | "Your take on [topic] was sharp"

ABSOLUTE RULES:
- Total email body: under 125 words
- No attachments
- One link maximum
- Plain text format (no HTML templates)
- Sign with first name only

TONE: Direct and human. Topic: ${core_message}. Audience: ${audience}.`,

    "Newsletter Section": `You are a newsletter editor for a high-performing email list. Write one newsletter section that drives opens, reads, and clicks.

STRUCTURE:
- LEAD (1-2 sentences): State the insight or topic with an angle that makes it feel urgent or valuable.
- BODY (3 key points): Each point has a BOLD label (3-5 words) followed by 1-2 sentences. The three points should tell a mini-story: Problem → Solution → Result.
- CTA (1-2 sentences): What should the reader do next? Read a post, try a tactic, reply with a thought.

WRITING RULES:
- Write like a smart friend sending an email to another smart friend
- Contractions are OK. Sentence fragments are OK. Personality is mandatory.
- One idea per paragraph. Max 3 sentences per paragraph.
- NO jargon, no buzzwords, no hedging language ("might", "could", "perhaps")
- End with an open loop that makes them want the next section or to click the CTA

TONE: ${tone}
TOPIC: ${core_message}
AUDIENCE: ${audience}`,

    "YouTube Description": `You are an SEO-optimized YouTube description writer. Write a description that ranks, hooks, and converts.

DESCRIPTION STRUCTURE:
1. ABOVE THE FOLD (first 2 lines — visible before "show more"):
   - Hook line that makes someone want to watch
   - Include primary keyword naturally
2. SUMMARY (3-5 sentences):
   - What the video covers
   - Why it matters
   - What they'll learn
3. TIMESTAMPS:
   - Create 4-6 logical timestamp sections based on the content
   - Format: "00:00 - Intro" / "01:23 - Key Section" / etc.
4. CTA BLOCK (3 lines):
   - Subscribe with reason
   - Comment prompt
   - Related video/watch next suggestion
5. SEO HASHTAGS (5-8):
   - Mix of broad (#marketing) and niche (#B2Bcontentstrategy)
   - No more than 3 tags per line
6. LINKS (if relevant):
   - Mention relevant resources or social profiles

SEO RULES:
- Lead with the primary keyword in the first 100 characters
- Use secondary keywords naturally throughout
- Write for humans first, search engines second

TONE: ${tone}
TOPIC: ${core_message}
AUDIENCE: ${audience}`,

    "Instagram Caption": `You are an Instagram copywriter who drives engagement and saves.

FORMAT:
- LINE 1 (the hook — this is the ONLY visible line before "more"): Must be a thought-stopping statement, question, or bold claim. NO emoji in line 1.
- LINES 2-5: 3-5 short paragraphs. Tell the story, share the insight, or make the argument.
- LINE 6 (the CTA): End with a question that invites comments or a prompt to save/share.
- HASHTAGS (at the end, after 2 line breaks): 5-8 hashtags — mix of 3 niche, 2-3 medium, 1-2 broad.

WRITING RULES:
- Max 1-2 emojis in the body, and only where they add meaning
- One idea per paragraph. Short lines. White space is engagement.
- Use line breaks intentionally for emphasis and readability
- NO "link in bio" in the caption — put that in the first comment
- Write conversationally, not like a brand

TONE: ${tone}
TOPIC: ${core_message}
AUDIENCE: ${audience}`,

    "Personal Brand Bio Update": `You are a personal branding copywriter. Write a 3-sentence bio that makes people want to work with, follow, or invest in this person.

THE 3-SENTENCE FORMULA:
SENTENCE 1 — Position + Unique Value: Who they are + what they do + what makes them different. Specific outcomes or niche.
SENTENCE 2 — Proof + Credibility: Track record, interesting stat, notable achievement, or what they've built.
SENTENCE 3 — Current Focus + CTA: What they're working on now + open to (collabs, clients, opportunities, etc.)

ABSOLUTE RULES:
- No buzzwords: "passionate about", "results-driven", "thought leader", "guru", "ninja"
- No third-person for personal accounts (use first person for personal, third person for company)
- Sound like a real human, not a LinkedIn cliché
- Each sentence must be under 25 words
- Total bio: under 100 words

CONTEXT: ${core_message}
AUDIENCE who will read this: ${audience}
TONE: Direct, confident, human`,
  };

  return prompts[format];
};

export const generateFormat = async (
  format: ContentFormat,
  strategy: ContentStrategy,
  rawInput: string,
): Promise<string> => {
  const systemPrompt = getFormatPrompt(format, strategy);
  return callGroq(systemPrompt, `Original input for context:\n${rawInput}`);
};

export const generateAllFormats = async (
  selectedFormats: ContentFormat[],
  strategy: ContentStrategy,
  rawInput: string,
  onProgress: (format: ContentFormat, content: string, error?: string) => void,
): Promise<void> => {
  const results = selectedFormats.map(async (format) => {
    try {
      const content = await generateFormat(format, strategy, rawInput);
      onProgress(format, content);
    } catch {
      onProgress(format, "", "Generation failed");
    }
  });

  await Promise.allSettled(results);
};
