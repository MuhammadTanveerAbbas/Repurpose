import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { BrandIcon } from "@/components/BrandIcon";

const publicNavLinks = [
  { to: "/dashboard", label: "Generate" },
  { to: "/pricing", label: "Pricing" },
];

const landingAnchorLinks = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#faq", label: "FAQ" },
];

export interface NavTab {
  key: string;
  label: string;
}

interface NavbarProps {
  tabs?: NavTab[];
  activeTab?: string;
  onTabChange?: (key: string) => void;
}

export const Navbar = ({ tabs, activeTab, onTabChange }: NavbarProps) => {
  const { user, profile, signOut } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const avatarUrl =
    user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture ?? null;
  const initials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
    : (user?.email?.[0]?.toUpperCase() ?? "U");

  const hasTabs = tabs && tabs.length > 0 && onTabChange;

  return (
    <div className="sticky top-0 z-50 px-4 pt-3 pb-2 sm:px-6">
      {/* Desktop pill navbar */}
      <div className="hidden md:flex mx-auto max-w-3xl items-center gap-1 bg-white/90 backdrop-blur-md border border-stone-200/80 rounded-2xl px-2 py-1.5 shadow-[0_2px_16px_rgba(0,0,0,0.07)]">
        {/* Logo */}
        <Link
          to={user ? "/dashboard" : "/"}
          className="flex items-center gap-2 px-2 py-1 shrink-0 mr-1"
          aria-label="Repurpose AI home"
        >
          <BrandIcon className="h-6 w-6 rounded-[6px]" />
          <span className="font-display text-sm font-semibold text-stone-900 tracking-tight">
            Repurpose AI
          </span>
        </Link>

        {/* Divider */}
        <div className="h-5 w-px bg-stone-200 mx-1 shrink-0" />

        {/* Center tabs / nav links */}
        <div className="flex items-center gap-0.5 flex-1">
          {hasTabs ? (
            tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => onTabChange(tab.key)}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-sm font-medium font-sans capitalize transition-all",
                  activeTab === tab.key
                    ? "bg-primary text-white shadow-sm"
                    : "text-stone-500 hover:text-stone-800 hover:bg-stone-100",
                )}
              >
                {tab.label}
              </button>
            ))
          ) : (
            <>
              {publicNavLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={cn(
                    "px-3.5 py-1.5 text-sm rounded-xl transition-all font-sans font-medium inline-block",
                    location.pathname === link.to
                      ? "bg-primary text-white shadow-sm"
                      : "text-stone-500 hover:text-stone-800 hover:bg-stone-100",
                  )}
                >
                  {link.label}
                </Link>
              ))}
              {location.pathname === "/" &&
                landingAnchorLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="px-3.5 py-1.5 text-sm rounded-xl transition-all font-sans font-medium inline-block text-stone-500 hover:text-stone-800 hover:bg-stone-100"
                  >
                    {link.label}
                  </a>
                ))}
            </>
          )}
        </div>

        {/* Right - avatar or auth */}
        <div className="flex items-center gap-1.5 shrink-0 ml-1">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="h-7 w-7 cursor-pointer hover:ring-2 hover:ring-amber-300/60 transition-shadow">
                  {avatarUrl && (
                    <AvatarImage
                      src={avatarUrl}
                      alt={profile?.full_name ?? "User"}
                    />
                  )}
                  <AvatarFallback className="text-[11px] font-semibold bg-amber-100 text-amber-700">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-52 bg-white border-stone-200 mt-1"
              >
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium text-stone-900 truncate">
                    {profile?.full_name ?? "User"}
                  </p>
                  <p className="text-xs text-stone-400 truncate">
                    {user.email}
                  </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={signOut}
                  className="gap-2 cursor-pointer text-red-500"
                >
                  <LogOut className="h-3.5 w-3.5" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link to="/login">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl font-sans text-sm"
                >
                  Log in
                </Button>
              </Link>
              <Link to="/signup">
                <Button
                  size="sm"
                  className="h-8 bg-primary hover:bg-primary/90 text-white rounded-xl font-sans font-semibold shadow-brand transition-all active:scale-[0.98] text-sm"
                >
                  Get started
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile pill navbar */}
      <div className="flex md:hidden items-center justify-between bg-white/90 backdrop-blur-md border border-stone-200/80 rounded-2xl px-3 py-2 shadow-[0_2px_16px_rgba(0,0,0,0.07)]">
        <Link
          to={user ? "/dashboard" : "/"}
          className="flex items-center gap-2"
          aria-label="Repurpose AI home"
        >
          <BrandIcon className="h-6 w-6 rounded-[6px]" />
          <span className="font-display text-sm font-semibold text-stone-900 tracking-tight">
            Repurpose AI
          </span>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-stone-600 rounded-xl"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? (
            <X className="h-4 w-4" />
          ) : (
            <Menu className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="md:hidden mt-1.5 mx-auto bg-white border border-stone-200/80 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] px-3 py-3 space-y-1">
          {user && (
            <div className="flex items-center gap-3 px-2 py-2 mb-1 border-b border-stone-100 pb-3">
              <Avatar className="h-8 w-8 shrink-0">
                {avatarUrl && (
                  <AvatarImage
                    src={avatarUrl}
                    alt={profile?.full_name ?? "User"}
                  />
                )}
                <AvatarFallback className="text-xs font-semibold bg-amber-100 text-amber-700">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm font-medium text-stone-900 truncate">
                  {profile?.full_name ?? "User"}
                </p>
                <p className="text-xs text-stone-400 truncate">{user.email}</p>
              </div>
            </div>
          )}

          {hasTabs ? (
            tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  onTabChange(tab.key);
                  setMobileOpen(false);
                }}
                className={cn(
                  "w-full text-left px-3 py-2.5 text-sm rounded-xl font-sans capitalize font-medium transition-all",
                  activeTab === tab.key
                    ? "bg-primary text-white"
                    : "text-stone-500 hover:text-stone-900 hover:bg-stone-50",
                )}
              >
                {tab.label}
              </button>
            ))
          ) : (
            <>
              {publicNavLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "block w-full text-left px-3 py-2.5 text-sm rounded-xl font-sans font-medium transition-all",
                    location.pathname === link.to
                      ? "bg-primary text-white"
                      : "text-stone-500 hover:text-stone-900 hover:bg-stone-50",
                  )}
                >
                  {link.label}
                </Link>
              ))}
              {location.pathname === "/" &&
                landingAnchorLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="block w-full text-left px-3 py-2.5 text-sm rounded-xl font-sans font-medium transition-all text-stone-500 hover:text-stone-900 hover:bg-stone-50"
                  >
                    {link.label}
                  </a>
                ))}
            </>
          )}

          <div className="h-px bg-stone-100 my-1" />

          {user ? (
            <button
              onClick={() => {
                signOut();
                setMobileOpen(false);
              }}
              className="w-full text-left px-3 py-2.5 text-sm text-red-500 rounded-xl flex items-center gap-2 font-sans hover:bg-red-50 transition-all"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          ) : (
            <div className="flex gap-2 pt-1">
              <Link
                to="/login"
                className="flex-1"
                onClick={() => setMobileOpen(false)}
              >
                <Button
                  variant="outline"
                  className="w-full border-stone-200 text-stone-700 rounded-xl"
                  size="sm"
                >
                  Log in
                </Button>
              </Link>
              <Link
                to="/signup"
                className="flex-1"
                onClick={() => setMobileOpen(false)}
              >
                <Button
                  className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl"
                  size="sm"
                >
                  Sign up
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
