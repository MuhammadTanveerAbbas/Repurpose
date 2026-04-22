import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";

function FullScreenLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export const ProtectedRoute = ({
  children,
}: {
  children?: React.ReactNode;
}) => {
  const { session, loading } = useAuth();

  if (loading) return <FullScreenLoader />;

  if (!session) return <Navigate to="/login" replace />;

  // Support both Outlet (layout route) and children (wrapper) usage
  return children ? <>{children}</> : <Outlet />;
};
