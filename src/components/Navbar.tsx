import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Settings, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { BrandIcon } from "@/components/BrandIcon";

const navLinks = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/templates", label: "Templates" },
  { to: "/pricing", label: "Pricing" },
];

const BrandIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 64 64"
    fill="none"
    className={className}
    aria-hidden="true"
  >
    <rect width="64" height="64" rx="14" fill="#E8743A" />
    <path
      d="M32 16 C23.2 16 16 23.2 16 32 C16 40.8 23.2 48 32 48 C38.4 48 43.9 44.3 46.6 38.9"
      stroke="white"
      strokeWidth="3.5"
      strokeLinecap="round"
      fill="none"
    />
    <path d="M46.6 38.9 L50 32 L43 34.5 Z" fill="white" />
    <path d="M35 22 L28 33 L33 33 L29 42 L38 29 L33 29 Z" fill="white" opacity="0.95" />
  </svg>
);

export const Navbar = () => {
  const { user, profile, signOut } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const avatarUrl = user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture ?? null;
  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? "U";

  return (
    <nav className="sticky top-0 z-50 border-b border-stone-200/60 bg-[#F8F5F0]/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center px-4 sm:px-6">
        {/* Logo */}
        <Link
          to={user ? "/dashboard" : "/"}
          className="flex items-center gap-2 shrink-0"
          aria-label="Repurpose AI home"
        >
          <BrandIcon className="h-7 w-7 rounded-[7px]" />
          <span className="font-display text-lg font-semibold text-stone-900 tracking-tight hidden sm:inline">
            Repurpose AI
          </span>
        </Link>

        {/* Desktop center nav */}
        <div className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
          {navLinks.map(link => (
            <Link key={link.to} to={link.to}>
              <button
                className={cn(
                  "px-3 py-1.5 text-sm rounded-xl transition-colors font-sans",
                  location.pathname === link.to
                    ? "bg-white shadow-sm font-medium text-stone-900 border border-stone-100"
                    : "text-stone-500 hover:text-stone-900 hover:bg-stone-100/60"
                )}
              >
                {link.label}
              </button>
            </Link>
          ))}
        </div>

        <div className="flex-1" />

        {/* Desktop right side */}
        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-amber-300/50 transition-shadow">
                  {avatarUrl && <AvatarImage src={avatarUrl} alt={profile?.full_name ?? "User"} />}
                  <AvatarFallback className="text-xs font-medium bg-amber-100 text-amber-700">{initials}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 bg-white border-stone-200">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium text-stone-900 truncate">{profile?.full_name ?? "User"}</p>
                  <p className="text-xs text-stone-400 truncate">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="gap-2 cursor-pointer text-stone-700">
                    <Settings className="h-3.5 w-3.5" /> Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="gap-2 cursor-pointer text-red-500">
                  <LogOut className="h-3.5 w-3.5" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" size="sm" className="text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl font-sans">
                  Log in
                </Button>
              </Link>
              <Link to="/signup">
                <Button size="sm" className="bg-[#E8743A] hover:bg-[#D4632A] text-white rounded-xl font-sans font-semibold shadow-brand hover:shadow-[0_6px_20px_rgba(232,116,58,0.4)] transition-all active:scale-[0.98]">
                  Get started
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile hamburger */}
        <div className="flex items-center gap-1 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-stone-600"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-stone-200 bg-[#F8F5F0] px-4 py-3 space-y-1">
          {user && (
            <div className="flex items-center gap-3 px-3 py-2 mb-1 border-b border-stone-200 pb-3">
              <Avatar className="h-9 w-9 shrink-0">
                {avatarUrl && <AvatarImage src={avatarUrl} alt={profile?.full_name ?? "User"} />}
                <AvatarFallback className="text-xs font-medium bg-amber-100 text-amber-700">{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm font-medium text-stone-900 truncate">{profile?.full_name ?? "User"}</p>
                <p className="text-xs text-stone-400 truncate">{user.email}</p>
              </div>
            </div>
          )}
          {navLinks.map(link => (
            <Link key={link.to} to={link.to} onClick={() => setMobileOpen(false)}>
              <button className={cn(
                "w-full text-left px-3 py-2.5 text-sm rounded-xl font-sans",
                location.pathname === link.to
                  ? "bg-white shadow-sm font-medium text-stone-900"
                  : "text-stone-500 hover:text-stone-900 hover:bg-white/60"
              )}>
                {link.label}
              </button>
            </Link>
          ))}
          {user ? (
            <>
              <Link to="/settings" onClick={() => setMobileOpen(false)}>
                <button className="w-full text-left px-3 py-2.5 text-sm text-stone-500 rounded-xl flex items-center gap-2 font-sans hover:bg-white/60">
                  <Settings className="h-3.5 w-3.5" /> Settings
                </button>
              </Link>
              <button
                onClick={() => { signOut(); setMobileOpen(false); }}
                className="w-full text-left px-3 py-2.5 text-sm text-red-500 rounded-xl flex items-center gap-2 font-sans hover:bg-red-50"
              >
                <LogOut className="h-3.5 w-3.5" /> Sign out
              </button>
            </>
          ) : (
            <div className="flex gap-2 pt-2">
              <Link to="/login" className="flex-1" onClick={() => setMobileOpen(false)}>
                <Button variant="outline" className="w-full border-stone-200 text-stone-700 rounded-xl" size="sm">Log in</Button>
              </Link>
              <Link to="/signup" className="flex-1" onClick={() => setMobileOpen(false)}>
                <Button className="w-full bg-[#E8743A] hover:bg-[#D4632A] text-white rounded-xl" size="sm">Sign up</Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};
