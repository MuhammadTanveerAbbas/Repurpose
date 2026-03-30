import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const Settings = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [saving, setSaving] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName })
      .eq("id", user.id);
    if (error) toast.error("Failed to update profile");
    else {
      await refreshProfile();
      toast.success("Profile updated");
    }
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) toast.error(error.message);
    else {
      toast.success("Password updated");
      setNewPassword("");
    }
    setChangingPassword(false);
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure? This cannot be undone.")) return;
    toast.error("Account deletion requires admin support. Contact us.");
  };

  return (
    <div className="min-h-screen bg-[#F8F5F0]">
      <Navbar />
      <main className="mx-auto max-w-xl px-4 py-8 sm:px-6">
        <h1 className="font-display text-2xl sm:text-3xl text-stone-900 mb-8">Settings</h1>

        {/* Profile section */}
        <section className="mb-10">
          <h2 className="font-sans text-xs font-semibold uppercase tracking-wider text-stone-400 mb-4">Profile</h2>
          <div className="bg-white border border-stone-100 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="space-y-1.5">
              <Label className="font-sans text-sm font-medium text-stone-700">Full Name</Label>
              <Input value={fullName} onChange={e => setFullName(e.target.value)} className="h-10 rounded-xl border-stone-200 bg-white text-stone-900 placeholder:text-stone-400 focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 font-sans" />
            </div>
            <div className="space-y-1.5">
              <Label className="font-sans text-sm font-medium text-stone-700">Email</Label>
              <Input value={user?.email ?? ""} disabled className="h-10 rounded-xl border-stone-200 bg-stone-50 text-stone-400 font-sans" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="font-sans text-sm font-medium text-stone-700">Content Type</Label>
                <Input value={profile?.content_type?.replace(/_/g, " ") ?? "Not set"} disabled className="h-10 rounded-xl border-stone-200 bg-stone-50 text-stone-400 capitalize font-sans" />
              </div>
              <div className="space-y-1.5">
                <Label className="font-sans text-sm font-medium text-stone-700">Output Goal</Label>
                <Input value={profile?.output_goal?.replace(/_/g, " ") ?? "Not set"} disabled className="h-10 rounded-xl border-stone-200 bg-stone-50 text-stone-400 capitalize font-sans" />
              </div>
            </div>
            <Button
              size="sm"
              className="rounded-xl bg-[#E8743A] hover:bg-[#D4632A] text-white font-sans font-semibold shadow-brand transition-all active:scale-[0.98]"
              onClick={handleSaveProfile}
              disabled={saving}
            >
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </section>

        <div className="h-px bg-stone-200 mb-10" />

        {/* Password section */}
        <section className="mb-10">
          <h2 className="font-sans text-xs font-semibold uppercase tracking-wider text-stone-400 mb-4">Password</h2>
          <div className="bg-white border border-stone-100 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="space-y-1.5">
              <Label className="font-sans text-sm font-medium text-stone-700">New Password</Label>
              <Input type="password" placeholder="Min 6 characters" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="h-10 rounded-xl border-stone-200 bg-white text-stone-900 placeholder:text-stone-400 focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 font-sans" />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl border-stone-200 text-stone-700 hover:bg-stone-50 font-sans"
              onClick={handleChangePassword}
              disabled={changingPassword}
            >
              {changingPassword ? "Updating…" : "Update password"}
            </Button>
          </div>
        </section>

        <div className="h-px bg-stone-200 mb-10" />

        {/* Danger zone */}
        <section>
          <h2 className="font-sans text-xs font-semibold uppercase tracking-wider text-red-400 mb-4">Danger Zone</h2>
          <div className="bg-white border border-stone-100 rounded-2xl p-6 shadow-sm">
            <p className="font-sans text-sm text-stone-500 mb-3">Permanently delete your account and all data.</p>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl border-red-200 text-red-400 hover:bg-red-50 font-sans"
              onClick={handleDeleteAccount}
            >
              Delete account
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Settings;
