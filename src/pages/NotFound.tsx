import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8F5F0]">
      <div className="text-center">
        <h1 className="font-display text-6xl font-semibold text-stone-200 mb-4">404</h1>
        <p className="font-sans text-lg text-stone-500 mb-6">Oops! Page not found</p>
        <a href="/" className="font-sans text-sm font-medium text-amber-600 hover:underline">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
