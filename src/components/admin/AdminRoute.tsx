import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAdminSession } from "@/hooks/use-admin-session";

export default function AdminRoute() {
  const { session, loading } = useAdminSession();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        Loading admin...
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
