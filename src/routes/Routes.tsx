import { lazy, Suspense, useMemo } from "react";
import FallbackPage from "@/components/fallback-page";
import Auth from "./Auth/Auth";
import { userRoutesList, adminRoutesList } from "@/constants/constants";
import type { AppRoute } from "../helpers/routeAccessHelpers";

// Lazy load route components to optimize performance
const AdminRoutes = lazy(() => import("./AdminRoutes/AdminRoutes"));
const UserRoutes = lazy(() => import("./UserRoutes/UserRoutes"));

const Routes = () => {
  const isLoggedIn = false;
  const accountType: "admin" | "user" = "user";
  const routeListsByRole: Record<"admin" | "user", AppRoute[]> = {
    admin: adminRoutesList,
    user: userRoutesList,
  };
  const routeList = routeListsByRole[accountType];

  // Memoized function to determine the correct routes
  const renderRoutes = useMemo(() => {
    if (!isLoggedIn) return <Auth />;

    const roleRoutes = {
      admin: <AdminRoutes routeList={routeList} />,
      user: <UserRoutes routeList={routeList} />,
    };

    return roleRoutes[accountType] || <Auth />; // Fallback in case of an unknown role
  }, [isLoggedIn, accountType, routeList]);

  return <Suspense fallback={<FallbackPage />}>{renderRoutes}</Suspense>;
};

export default Routes;
