import { lazy, Suspense, useMemo } from "react";
import FallbackPage from "@/components/fallback-page";
import Auth from "./Auth/Auth.jsx";

// Lazy load route components to optimize performance
const AdminRoutes = lazy(() => import("./UserRoutes/UserRoutes.jsx"));
const UserRoutes = lazy(() => import("./AdminRoutes/AdminRoutes.jsx"));

const Routes = () => {

  const isLoggedIn = true;
  const accountType = 'admin';

  // Memoized function to determine the correct routes
  const renderRoutes = useMemo(() => {
    if (!isLoggedIn) return <Auth />;

    const roleRoutes = {
      admin: <AdminRoutes />,
      user: <UserRoutes />,
    };

    return roleRoutes[accountType] || <Auth />; // Fallback in case of an unknown role
  }, [isLoggedIn, accountType]);

  return <Suspense fallback={<FallbackPage isPadding={false} />}>{renderRoutes}</Suspense>;
};

export default Routes;