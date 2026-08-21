import type { AuthError } from "@supabase/supabase-js";

/** Maps raw Supabase auth errors to clear, user-friendly messages. */
export function getAuthErrorMessage(error: AuthError): string {
  const message = error.message.toLowerCase();

  if (message.includes("invalid login credentials")) {
    return "Invalid email or password.";
  }
  if (message.includes("email not confirmed")) {
    return "Please confirm your email first. Check your inbox for the confirmation link.";
  }
  if (message.includes("user already registered")) {
    return "An account with this email already exists. Try signing in instead.";
  }
  if (
    message.includes("too many requests") ||
    message.includes("rate limit") ||
    error.status === 429
  ) {
    return "Too many attempts. Please wait a minute and try again.";
  }
  if (message.includes("password should be at least")) {
    return "Password must be at least 6 characters.";
  }
  if (message.includes("failed to fetch") || message.includes("network")) {
    return "Network error. Check your connection and try again.";
  }
  if (message.includes("session not found") || message.includes("refresh token")) {
    return "Your session expired. Please sign in again.";
  }

  return error.message || "Something went wrong. Please try again.";
}
