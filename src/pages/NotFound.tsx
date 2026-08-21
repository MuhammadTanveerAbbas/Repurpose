import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    document.title = "Page not found - Repurpose AI";
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex items-center justify-center px-4 py-20">
        <div className="text-center max-w-sm">
          <h1 className="font-display text-7xl font-semibold text-stone-200 mb-4">404</h1>
          <p className="font-sans text-lg text-stone-500 mb-2">Page not found</p>
          <p className="font-sans text-sm text-stone-400 mb-8 leading-relaxed">
            The page <code className="text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded text-xs">{location.pathname}</code> doesn't exist or has been moved.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link to="/">
              <Button className="rounded-xl bg-primary hover:bg-primary/90 text-white font-sans font-semibold shadow-brand">
                Go home
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="outline" className="rounded-xl border-stone-200 text-stone-700 font-sans">
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
