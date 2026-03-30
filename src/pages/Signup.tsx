import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandIcon } from "@/components/BrandIcon";
import { toast } from "sonner";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName },
      },
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Account created! Check your email to confirm.");
      navigate("/onboarding");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F8F5F0] flex items-center justify-center px-4 py-12">
      <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-amber-50 to-transparent pointer-events-none" />

      <div className="w-full max-w-md relative">
        <div className="bg-white border border-stone-200 rounded-2xl shadow-md p-8">
          {/* Logo */}
          <div className="flex flex-col items-center gap-2 mb-6">
            <Link to="/" aria-label="Repurpose AI home">
              <BrandIcon className="h-12 w-12" />
            </Link>
            <Link to="/" className="font-display text-xl font-semibold text-stone-900 tracking-tight">
              Repurpose AI
            </Link>
          </div>

          <h1 className="font-display text-2xl font-semibold text-stone-900 text-center mb-1">Create your account</h1>
          <p className="font-sans text-sm text-stone-500 text-center mb-7">Start with 3 free projects per month</p>

          {/* Google OAuth */}
          <Button
            variant="outline"
            className="w-full h-11 gap-2 mb-5 rounded-xl border-stone-200 bg-white hover:bg-stone-50 text-sm font-medium text-stone-700 font-sans"
            onClick={async () => {
              const { error } = await lovable.auth.signInWithOAuth("google", {
                redirect_uri: window.location.origin,
              });
              if (error) toast.error(error.message);
            }}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </Button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-stone-200" />
            <span className="text-xs text-stone-400 font-sans">or</span>
            <div className="flex-1 h-px bg-stone-200" />
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="font-sans text-sm font-medium text-stone-700">Full name</Label>
              <Input
                id="name"
                placeholder="Jane Doe"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
                className="h-11 rounded-xl border-stone-200 bg-white text-stone-900 placeholder:text-stone-400 focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 font-sans"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="font-sans text-sm font-medium text-stone-700">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="h-11 rounded-xl border-stone-200 bg-white text-stone-900 placeholder:text-stone-400 focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 font-sans"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="font-sans text-sm font-medium text-stone-700">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Min 6 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                className="h-11 rounded-xl border-stone-200 bg-white text-stone-900 placeholder:text-stone-400 focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 font-sans"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-11 rounded-xl bg-[#E8743A] hover:bg-[#D4632A] text-white font-sans font-semibold shadow-brand hover:shadow-[0_6px_20px_rgba(232,116,58,0.4)] transition-all active:scale-[0.98]"
              disabled={loading}
            >
              {loading ? "Creating account…" : "Get started free"}
            </Button>
          </form>

          <p className="mt-6 text-center font-sans text-sm text-stone-500">
            Already have an account?{" "}
            <Link to="/login" className="text-amber-600 hover:underline font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
