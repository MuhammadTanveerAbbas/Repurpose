import { describe, expect, it } from "vitest";
import { getAuthErrorMessage } from "../lib/auth-errors";
import type { AuthError } from "@supabase/supabase-js";

const makeError = (message: string, status?: number): AuthError =>
  ({
    message,
    status,
    name: "AuthError",
  }) as unknown as AuthError;

describe("getAuthErrorMessage", () => {
  it("maps invalid credentials", () => {
    expect(getAuthErrorMessage(makeError("Invalid login credentials"))).toBe(
      "Invalid email or password.",
    );
  });

  it("maps unconfirmed email", () => {
    expect(getAuthErrorMessage(makeError("Email not confirmed"))).toContain(
      "confirm your email",
    );
  });

  it("maps already registered", () => {
    expect(getAuthErrorMessage(makeError("User already registered"))).toContain(
      "already exists",
    );
  });

  it("maps rate limits by message", () => {
    expect(getAuthErrorMessage(makeError("Too many requests"))).toContain(
      "Too many attempts",
    );
  });

  it("maps rate limits by status code", () => {
    expect(getAuthErrorMessage(makeError("Request failed", 429))).toContain(
      "Too many attempts",
    );
  });

  it("maps network failures", () => {
    expect(getAuthErrorMessage(makeError("Failed to fetch"))).toContain(
      "Network error",
    );
  });

  it("falls back to the raw message", () => {
    expect(getAuthErrorMessage(makeError("Something odd happened"))).toBe(
      "Something odd happened",
    );
  });
});
