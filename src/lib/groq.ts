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

export const callGroq = async (
  systemPrompt: string,
  userMessage: string,
): Promise<string> => {
  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature: 0.75,
        max_tokens: 1200,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Groq API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content ?? "";
};

const STRATEGY_SYSTEM_PROMPT = `You are a content strategist AI for solo founders and creators. 
Your job is to analyze any input (idea, transcript, YouTube URL content, pain point) 
and determine:
1. The core message or hook in one sentence
2. Who the audience is (best guess)
3. Which content formats will perform best for this specific input (choose 3–5 from the list below)
4. A recommended tone (Direct, Story-driven, Educational, Provocative, or Conversational)
5. A one-line content strategy recommendation

Content format options:
- LinkedIn Post (long-form, thought leadership)
- LinkedIn Hook (punchy opener only, 3 lines max)
- Twitter/X Thread (5–8 tweets with numbering)
- Short-form Video Script (hook + body + CTA, under 60 seconds)
- Cold Email Draft (subject line + 4-line email body)
- Newsletter Section (intro + 3 key points + CTA)
- YouTube Description (SEO-optimized, with timestamps placeholder)
- Instagram Caption (punchy, emoji-light, hashtag block)
- Personal Brand Bio Update (third-person, 3 sentences)

Return ONLY valid JSON in this exact shape:
{
  "core_message": "string",
  "audience": "string",
  "recommended_formats": ["format1", "format2", "format3"],
  "tone": "string",
  "strategy_note": "string"
}`;

export const analyzeContent = async (
  input: string,
  mode: InputMode,
): Promise<ContentStrategy> => {
  const userMessage = `Input mode: ${mode}\n\nContent:\n${input}`;

  const raw = await callGroq(STRATEGY_SYSTEM_PROMPT, userMessage);

  const tryParse = (text: string): ContentStrategy | null => {
    try {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) return null;
      return JSON.parse(match[0]) as ContentStrategy;
    } catch {
      return null;
    }
  };

  let result = tryParse(raw);
  if (!result) {
    const retry = await callGroq(STRATEGY_SYSTEM_PROMPT, userMessage);
    result = tryParse(retry);
  }

  if (!result) {
    throw new Error(
      "Couldn't parse the strategy response. Groq might be slow — try again.",
    );
  }

  return result;
};

const getFormatPrompt = (
  format: ContentFormat,
  strategy: ContentStrategy,
): string => {
  const { core_message, audience, tone } = strategy;

  const prompts: Record<ContentFormat, string> = {
    "LinkedIn Post": `Write a LinkedIn long-form post (150–300 words). 
Lead with a hook that stops the scroll. 
Use short paragraphs (1–2 sentences max). 
Tell a story or share a hard-won insight. 
End with a question or CTA that invites engagement. 
No hashtags in body. Add 3–5 hashtags at the end only.
Tone: ${tone}. Topic: ${core_message}. Audience: ${audience}.`,

    "LinkedIn Hook": `Write ONLY the opening 3 lines of a LinkedIn post. 
These 3 lines must be so good that someone stops scrolling and clicks "see more". 
No fluff. No "I'm excited to share". Start with tension, a number, or a bold claim.
Tone: ${tone}. Topic: ${core_message}.`,

    "Twitter/X Thread": `Write a Twitter/X thread of 6–8 tweets. 
Tweet 1 is the hook — bold, specific, makes people want to read on.
Number each tweet (1/, 2/, etc.).
Each tweet is under 280 characters.
Last tweet is a CTA or summary.
No filler tweets. Every tweet must add value.
Tone: ${tone}. Topic: ${core_message}. Audience: ${audience}.`,

    "Short-form Video Script": `Write a short-form video script for TikTok/Reels/Shorts (under 60 seconds when spoken at normal pace).
Structure: Hook (0–3s) → Problem/Insight (3–30s) → Payoff/CTA (30–60s).
Write it as spoken word — casual, punchy, no corporate language.
Include [pause], [cut], or [b-roll: X] cues where useful.
Tone: ${tone}. Topic: ${core_message}. Audience: ${audience}.`,

    "Cold Email Draft": `Write a cold email with:
- Subject line (under 8 words, no clickbait)
- Email body (4 lines max: 1 opener, 1 value line, 1 ask, 1 PS or social proof)
- Zero fluff. Every word must earn its place.
This is not a newsletter. It's a human-to-human email.
Tone: Direct. Topic: ${core_message}. Audience: ${audience}.`,

    "Newsletter Section": `Write a newsletter section (not a full newsletter — just one section).
Format: Short intro (2 sentences) → 3 key points (each with a bold label and 1–2 sentences) → CTA.
Sound like a smart friend writing to their list, not a corporate blog.
Tone: ${tone}. Topic: ${core_message}. Audience: ${audience}.`,

    "YouTube Description": `Write a YouTube video description optimized for search and clicks.
Structure:
- First 2 lines: hook (visible before "show more") 
- 3–5 sentence summary of what the video covers
- Timestamps placeholder block (00:00 – Intro, etc. — use logical guesses based on topic)
- 3 CTA lines (subscribe, comment, related video)
- 5–8 SEO hashtags at the bottom
Tone: ${tone}. Topic: ${core_message}.`,

    "Instagram Caption": `Write an Instagram caption.
- First line is the hook (no emoji to start — use words)
- 3–5 short paragraphs
- Light emoji usage (1–2 max, only where they add meaning)
- 5–8 hashtags at the end (mix of niche + broad)
- End with a soft CTA (question or invite)
Tone: ${tone}. Topic: ${core_message}. Audience: ${audience}.`,

    "Personal Brand Bio Update": `Write a personal brand bio in third person.
3 sentences only:
1. Who they are + what they do
2. What makes them different or their track record
3. What they're focused on now or building
No buzzwords. No "passionate about". Sound like a real person.
Tone: Direct. Based on this context: ${core_message}. Audience who will read this: ${audience}.`,
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
