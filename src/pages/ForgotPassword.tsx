import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandIcon } from "@/components/BrandIcon";
import { toast } from "sonner";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/dashboard`,
    });
    if (error) {
      toast.error(error.message);
    } else {
      setSent(true);
      toast.success("Check your email for the reset link");
    }
    setLoading(false);
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
        <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-amber-50 to-transparent pointer-events-none" />
        <div className="w-full max-w-md relative">
          <div className="bg-white border border-stone-200 rounded-2xl shadow-md p-8 text-center">
            <div className="text-4xl mb-4">📧</div>
            <h1 className="font-display text-2xl font-semibold text-stone-900 mb-2">
              Check your email
            </h1>
            <p className="font-sans text-sm text-stone-500 mb-6">
              We sent a password reset link to <strong>{email}</strong>
            </p>
            <Link to="/login">
              <Button
                variant="outline"
                className="rounded-xl border-stone-200 text-stone-700 font-sans"
              >
                Back to login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-amber-50 to-transparent pointer-events-none" />

      <div className="w-full max-w-md relative">
        <div className="bg-white border border-stone-200 rounded-2xl shadow-md p-8">
          <div className="flex flex-col items-center gap-2 mb-6">
            <Link to="/" aria-label="Repurpose AI home">
              <BrandIcon className="h-12 w-12" />
            </Link>
            <Link
              to="/"
              className="font-display text-xl font-semibold text-stone-900 tracking-tight"
            >
              Repurpose AI
            </Link>
          </div>

          <h1 className="font-display text-2xl font-semibold text-stone-900 text-center mb-1">
            Reset your password
          </h1>
          <p className="font-sans text-sm text-stone-500 text-center mb-7">
            Enter your email and we'll send you a reset link
          </p>

          <form onSubmit={handleReset} className="space-y-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="email"
                className="font-sans text-sm font-medium text-stone-700"
              >
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 rounded-xl border-stone-200 bg-white text-stone-900 placeholder:text-stone-400 focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 font-sans"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-white font-sans font-semibold shadow-brand hover:shadow-[0_6px_20px_rgba(232,116,58,0.4)] transition-all active:scale-[0.98]"
              disabled={loading}
            >
              {loading ? "Sending…" : "Send reset link"}
            </Button>
          </form>

          <p className="mt-6 text-center font-sans text-sm text-stone-500">
            Remember your password?{" "}
            <Link
              to="/login"
              className="text-amber-600 hover:underline font-medium"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
