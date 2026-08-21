// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  cleanCaptionText,
  decodeHtmlEntities,
  extractJsonAfter,
  extractVideoId,
  fetchTranscript,
  TranscriptError,
} from "./youtube-transcript";

describe("extractVideoId", () => {
  it("accepts a bare 11-char video id", () => {
    expect(extractVideoId("dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("parses standard watch URLs", () => {
    expect(extractVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ",
    );
    expect(extractVideoId("https://youtube.com/watch?si=x&v=abc_dE12f3g")).toBe(
      "abc_dE12f3g",
    );
  });

  it("parses short, shorts, live, embed and v URLs", () => {
    expect(extractVideoId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(extractVideoId("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ",
    );
    expect(extractVideoId("https://www.youtube.com/live/dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ",
    );
    expect(extractVideoId("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ",
    );
    expect(extractVideoId("https://www.youtube.com/v/dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ",
    );
  });

  it("rejects invalid input", () => {
    expect(extractVideoId("")).toBeNull();
    expect(extractVideoId("too short")).toBeNull();
    expect(extractVideoId("https://example.com/watch?v=short")).toBeNull();
    expect(extractVideoId("https://example.com/video/dQw4w9WgXcQ")).toBeNull();
  });
});

describe("decodeHtmlEntities", () => {
  it("decodes named entities", () => {
    expect(decodeHtmlEntities("tom &amp; jerry &quot;show&quot;")).toBe(
      'tom & jerry "show"',
    );
    expect(decodeHtmlEntities("it&#39;s fine&nbsp;now")).toBe("it's fine now");
  });

  it("decodes numeric and hex entities", () => {
    expect(decodeHtmlEntities("&#72;&#105;")).toBe("Hi");
    expect(decodeHtmlEntities("&#x41;&#x42;")).toBe("AB");
  });

  it("leaves plain text untouched", () => {
    expect(decodeHtmlEntities("no entities here")).toBe("no entities here");
  });
});

describe("cleanCaptionText", () => {
  it("strips tags and collapses whitespace", () => {
    expect(cleanCaptionText("  hello <b>world</b>\n  again  ")).toBe(
      "hello world again",
    );
  });
});

describe("extractJsonAfter", () => {
  it("extracts a balanced JSON object after a marker", () => {
    const html = `var ytInitialPlayerResponse = {"a":{"b":"}"},"c":1};var next = {"x":2};`;
    expect(extractJsonAfter(html, "ytInitialPlayerResponse")).toEqual({
      a: { b: "}" },
      c: 1,
    });
  });

  it("returns null when marker or braces are missing", () => {
    expect(extractJsonAfter("nothing here", "ytInitialPlayerResponse")).toBeNull();
    expect(extractJsonAfter("marker with no brace", "marker")).toBeNull();
  });
});

const WATCH_HTML = (trackUrl: string) =>
  `<!doctype html><script>var ytInitialPlayerResponse = ${JSON.stringify({
    playabilityStatus: { status: "OK" },
    captions: {
      playerCaptionsTracklistRenderer: {
        captionTracks: [
          { baseUrl: trackUrl, languageCode: "en", kind: "asr" },
        ],
      },
    },
  })};</script>`;

describe("fetchTranscript", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("rejects invalid video ids immediately", async () => {
    await expect(fetchTranscript("bad-id")).rejects.toBeInstanceOf(
      TranscriptError,
    );
  });

  it("crawls the watch page and parses json3 captions", async () => {
    const fetchMock = vi.fn(async (url: string | URL | Request) => {
      const href = String(url);
      if (href.startsWith("https://www.youtube.com/watch")) {
        return new Response(WATCH_HTML("https://www.youtube.com/api/timedtext?v=x"), {
          status: 200,
        });
      }
      if (href.includes("timedtext")) {
        return new Response(
          JSON.stringify({
            events: [
              { tStartMs: 0, dDurationMs: 1500, segs: [{ utf8: "&amp; now" }] },
              { tStartMs: 1500, dDurationMs: 1000, segs: [{ utf8: "the show" }] },
            ],
          }),
          { status: 200 },
        );
      }
      return new Response("{}", { status: 404 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchTranscript("dQw4w9WgXcQ");
    expect(result.source).toBe("watch-page");
    expect(result.segments).toHaveLength(2);
    expect(result.segments[0]).toEqual({
      text: "& now",
      start: 0,
      duration: 1.5,
    });
  });

  it("falls back to XML captions when json3 fails", async () => {
    const fetchMock = vi.fn(async (url: string | URL | Request) => {
      const href = String(url);
      if (href.startsWith("https://www.youtube.com/watch")) {
        return new Response(WATCH_HTML("https://www.youtube.com/api/timedtext?v=x"), {
          status: 200,
        });
      }
      if (href.includes("fmt=json3")) {
        return new Response("not json", { status: 200 });
      }
      if (href.includes("timedtext")) {
        return new Response(
          `<transcript><text start="1.5" dur="2.0">hello &amp; hi</text></transcript>`,
          { status: 200 },
        );
      }
      return new Response("{}", { status: 404 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchTranscript("dQw4w9WgXcQ");
    expect(result.segments[0]).toEqual({
      text: "hello & hi",
      start: 1.5,
      duration: 2,
    });
  });

  it("throws TranscriptError when every strategy fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("{}", { status: 404 })),
    );

    await expect(fetchTranscript("dQw4w9WgXcQ")).rejects.toMatchObject({
      status: 404,
    });
  });
});
