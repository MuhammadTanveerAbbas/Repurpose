import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { toast } from "sonner";
import { Link } from "react-router-dom";

export const SettingsTab = () => {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState(profile?.full_name ?? "");

  useEffect(() => {
    setFullName(profile?.full_name ?? "");
  }, [profile?.full_name]);
  const [saving, setSaving] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const planLimits: Record<string, number> = {
    free: 5,
    creator: 9999,
    pro: 9999,
  };
  const limit = planLimits[profile?.plan ?? "free"] ?? 5;
  const used = profile?.projects_used_this_month ?? 0;

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

  const handleDeleteAccount = useCallback(async () => {
    if (!user) return;
    setDeleting(true);
    try {
      const { error } = await supabase.rpc("delete_user");
      if (error) throw error;

      await signOut();
      toast.success("Account deleted permanently");
      navigate("/");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete account"
      );
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  }, [user, signOut, navigate]);

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Plan status */}
      <div className="bg-white border border-stone-100 rounded-2xl p-5 shadow-sm">
        <p className="font-sans text-xs font-semibold uppercase tracking-wider text-stone-400 mb-3">
          Plan
        </p>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-sans font-semibold text-stone-800 capitalize">
              {profile?.plan ?? "free"} plan
            </p>
            <p className="font-sans text-xs text-stone-400 mt-0.5">
              {used}/{limit === 9999 ? "∞" : limit} generations used this month
            </p>
          </div>
          {profile?.plan === "free" && (
            <Link to="/pricing">
              <Button
                size="sm"
                className="rounded-xl bg-[#E8743A] hover:bg-[#D4632A] text-white font-sans font-semibold shadow-brand text-xs"
              >
                Upgrade
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Profile */}
      <div className="bg-white border border-stone-100 rounded-2xl p-5 shadow-sm space-y-4">
        <p className="font-sans text-xs font-semibold uppercase tracking-wider text-stone-400">
          Profile
        </p>
        <div className="space-y-1.5">
          <Label className="font-sans text-sm font-medium text-stone-700">
            Full Name
          </Label>
          <Input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="h-10 rounded-xl border-stone-200 bg-white text-stone-900 placeholder:text-stone-400 focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 font-sans"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="font-sans text-sm font-medium text-stone-700">
            Email
          </Label>
          <Input
            value={user?.email ?? ""}
            disabled
            className="h-10 rounded-xl border-stone-200 bg-stone-50 text-stone-400 font-sans"
          />
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

      {/* Password */}
      <div className="bg-white border border-stone-100 rounded-2xl p-5 shadow-sm space-y-4">
        <p className="font-sans text-xs font-semibold uppercase tracking-wider text-stone-400">
          Password
        </p>
        <div className="space-y-1.5">
          <Label className="font-sans text-sm font-medium text-stone-700">
            New Password
          </Label>
          <Input
            type="password"
            placeholder="Min 6 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="h-10 rounded-xl border-stone-200 bg-white text-stone-900 placeholder:text-stone-400 focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 font-sans"
          />
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

      {/* Danger zone */}
      <div className="bg-white border border-stone-100 rounded-2xl p-5 shadow-sm">
        <p className="font-sans text-xs font-semibold uppercase tracking-wider text-red-400 mb-3">
          Danger Zone
        </p>
        <p className="font-sans text-sm text-stone-500 mb-3">
          Permanently delete your account and all data. This action cannot be undone.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl border-red-200 text-red-500 hover:bg-red-50 font-sans"
          onClick={() => setShowDeleteDialog(true)}
        >
          Delete account
        </Button>
      </div>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete your account?"
        description="This will permanently delete your account, profile, and all projects. This action cannot be undone."
        confirmLabel={deleting ? "Deleting…" : "Delete my account"}
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={handleDeleteAccount}
      />
    </div>
  );
};
