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
import { LogOut, BarChart2, Wand2, Wrench, Clock, Settings } from "lucide-react";
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

// Icons for each dashboard tab used in mobile bottom bar
const TAB_ICONS: Record<string, React.ReactNode> = {
  stats: <BarChart2 className="h-4 w-4" />,
  generate: <Wand2 className="h-4 w-4" />,
  toolkit: <Wrench className="h-4 w-4" />,
  history: <Clock className="h-4 w-4" />,
  settings: <Settings className="h-4 w-4" />,
};

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

  const avatarUrl =
    user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture ?? null;
  const displayName = profile?.full_name ?? user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? null;
  const initials = displayName
    ? displayName
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : (user?.email?.[0]?.toUpperCase() ?? "U");

  const hasTabs = tabs && tabs.length > 0 && onTabChange;

  return (
    <>
      {/* ── Desktop pill navbar ─────────────────────────────── */}
      <div className="sticky top-0 z-50 px-4 pt-3 pb-2 sm:px-6 hidden md:block">
        <div className="flex mx-auto max-w-3xl items-center gap-1 bg-white/90 backdrop-blur-md border border-stone-200/80 rounded-2xl px-3 py-1.5 shadow-[0_2px_16px_rgba(0,0,0,0.07)]">
          {/* Logo */}
          <Link
            to={user ? "/dashboard" : "/"}
            className="flex items-center gap-2 px-2 py-1 shrink-0 mr-2"
            aria-label="Repurpose AI home"
          >
            <BrandIcon className="h-6 w-6 rounded-[6px]" />
            <span className="font-display text-sm font-semibold text-stone-900 tracking-tight whitespace-nowrap">
              Repurpose AI
            </span>
          </Link>

          <div className="h-5 w-px bg-stone-200 mx-1 shrink-0" />

          {/* Center tabs / nav links */}
          <div className="flex items-center gap-0.5 flex-1 overflow-x-auto no-scrollbar">
            {hasTabs ? (
              tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => onTabChange(tab.key)}
                  className={cn(
                    "px-4 py-1.5 rounded-xl text-sm font-medium font-sans capitalize transition-all whitespace-nowrap",
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
                      "px-4 py-1.5 text-sm rounded-xl transition-all font-sans font-medium inline-block whitespace-nowrap",
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
                      className="px-4 py-1.5 text-sm rounded-xl transition-all font-sans font-medium inline-block text-stone-500 hover:text-stone-800 hover:bg-stone-100 whitespace-nowrap"
                    >
                      {link.label}
                    </a>
                  ))}
              </>
            )}
          </div>

          {/* Right user avatar or auth buttons */}
          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            {user && <div className="h-5 w-px bg-stone-200 mr-0.5 shrink-0" />}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-xl px-2 py-1 hover:bg-stone-100 transition-all group">
                    <Avatar className="h-7 w-7 cursor-pointer">
                      {avatarUrl && (
                        <AvatarImage src={avatarUrl} alt={displayName ?? "User"} />
                      )}
                      <AvatarFallback className="text-[11px] font-semibold bg-amber-100 text-amber-700">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    {displayName && (
                      <span className="font-sans text-xs font-medium text-stone-700 max-w-[100px] truncate group-hover:text-stone-900">
                        {displayName.split(" ")[0]}
                      </span>
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-52 bg-white border-stone-200 mt-1"
                >
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium text-stone-900 truncate">
                      {displayName ?? "User"}
                    </p>
                    <p className="text-xs text-stone-400 truncate">{user.email}</p>
                    {profile?.plan && (
                      <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                        {profile.plan}
                      </span>
                    )}
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
      </div>

      {/* ── Mobile top bar ──────────────────────────────────── */}
      {/* Slim brand + user strip at top */}
      <div className="md:hidden sticky top-0 z-50 flex items-center justify-between bg-white/95 backdrop-blur-md border-b border-stone-200/60 px-4 py-2.5 shadow-sm">
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

        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 rounded-xl px-1.5 py-1 hover:bg-stone-100 transition-all">
                <Avatar className="h-7 w-7">
                  {avatarUrl && (
                    <AvatarImage src={avatarUrl} alt={displayName ?? "User"} />
                  )}
                  <AvatarFallback className="text-[11px] font-semibold bg-amber-100 text-amber-700">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                {displayName && (
                  <span className="font-sans text-xs font-medium text-stone-700 max-w-[72px] truncate">
                    {displayName.split(" ")[0]}
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 bg-white border-stone-200 mt-1">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium text-stone-900 truncate">
                  {displayName ?? "User"}
                </p>
                <p className="text-xs text-stone-400 truncate">{user.email}</p>
                {profile?.plan && (
                  <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                    {profile.plan}
                  </span>
                )}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="gap-2 cursor-pointer text-red-500">
                <LogOut className="h-3.5 w-3.5" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex gap-2">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="h-8 rounded-xl font-sans text-sm text-stone-600">
                Log in
              </Button>
            </Link>
            <Link to="/signup">
              <Button size="sm" className="h-8 bg-primary text-white rounded-xl font-sans font-semibold text-sm">
                Sign up
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* ── Mobile bottom tab bar (dashboard only) ─────────── */}
      {hasTabs && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-stone-200/60 shadow-[0_-2px_12px_rgba(0,0,0,0.06)]">
          <div className="flex items-stretch">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => onTabChange(tab.key)}
                  className={cn(
                    "flex-1 flex flex-col items-center justify-center gap-0.5 py-2 px-1 transition-all",
                    isActive ? "text-primary" : "text-stone-400 hover:text-stone-600",
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  <span className={cn("transition-transform", isActive && "scale-110")}>
                    {TAB_ICONS[tab.key] ?? <Wand2 className="h-4 w-4" />}
                  </span>
                  <span className={cn(
                    "font-sans text-[10px] font-medium leading-none transition-all",
                    isActive ? "text-primary font-semibold" : "text-stone-400",
                  )}>
                    {tab.label}
                  </span>
                  {isActive && (
                    <span className="absolute bottom-0 w-6 h-0.5 rounded-full bg-primary" />
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </>
  );
};
