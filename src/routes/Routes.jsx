import { lazy, Suspense, useMemo } from "react";
import FallbackPage from "@/components/fallback-page";
import Auth from "./Auth/Auth.jsx";
import { userRoutesList } from "@/constants/constants";

// Lazy load route components to optimize performance
const AdminRoutes = lazy(() => import("./AdminRoutes/AdminRoutes.jsx"));
const UserRoutes = lazy(() => import("./UserRoutes/UserRoutes.jsx"));

const Routes = () => {

  const isLoggedIn = true;
  const accountType = 'user';
  const routeList = userRoutesList; // userRoutesList | adminRoutesList (for now this is dummy)

  // Memoized function to determine the correct routes
  const renderRoutes = useMemo(() => {
    if (!isLoggedIn) return <Auth />;

    const roleRoutes = {
      admin: <AdminRoutes routeList={routeList} />,
      user: <UserRoutes routeList={routeList} />,
    };

    return roleRoutes[accountType] || <Auth />; // Fallback in case of an unknown role
  }, [isLoggedIn, accountType]);

  return <Suspense fallback={<FallbackPage isPadding={false} />}>{renderRoutes}</Suspense>;
};

export default Routes;