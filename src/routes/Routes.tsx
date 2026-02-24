import { lazy, Suspense, useMemo } from "react";
import FallbackPage from "@/components/fallback-page";
import Auth from "./Auth/Auth";
import { userRoutesList, adminRoutesList } from "@/constants/constants";
import type { AppRoute } from "../helpers/routeAccessHelpers";
import { useAppSelector } from "@/redux/store/hooks";

type AccountRole = "user" | "subuser" | "admin" | "subadmin";

// Lazy load route components to optimize performance
const AdminRoutes = lazy(() => import("./AdminRoutes/AdminRoutes"));
const UserRoutes = lazy(() => import("./UserRoutes/UserRoutes"));

const isAccountRole = (value: unknown): value is AccountRole =>
  value === "user" || value === "subuser" || value === "admin" || value === "subadmin";

const getAccessRouteList = (userData: Record<string, unknown>): AppRoute[] => {
  const routeList = userData.routeList;
  if (Array.isArray(routeList)) return routeList as AppRoute[];

  const accessRoutes = userData.accessRoutes;
  if (Array.isArray(accessRoutes)) return accessRoutes as AppRoute[];

  return [];
};

const Routes = () => {
  const userState = useAppSelector((state) => state.user);
  const isLoggedIn = userState.login && typeof userState.token === "string" && userState.token.length > 0;
  const roleCandidate = userState.type || userState.data.role;
  const role = isAccountRole(roleCandidate) ? roleCandidate : null;
  const roleGroup: "admin" | "user" | null =
    role === "admin" || role === "subadmin" ? "admin" : role === "user" || role === "subuser" ? "user" : null;

  const routeListsByRole: Record<"admin" | "user", AppRoute[]> = {
    admin: adminRoutesList,
    user: userRoutesList,
  };
  
  const fullRouteList = roleGroup ? routeListsByRole[roleGroup] : [];
  const userData = userState.data as Record<string, unknown>;
  const subRoleAccessRouteList = getAccessRouteList(userData);
  const isSubRole = role === "subuser" || role === "subadmin";
  const routeList = isSubRole ? subRoleAccessRouteList : fullRouteList;

  // Memoized function to determine the correct routes
  const renderRoutes = useMemo(() => {
    if (!isLoggedIn || !roleGroup) return <Auth />;
    if (isSubRole && routeList.length === 0) return <Auth />;

    const roleRoutes = {
      admin: <AdminRoutes routeList={routeList.length > 0 ? routeList : fullRouteList} />,
      user: <UserRoutes routeList={routeList.length > 0 ? routeList : fullRouteList} />,
    };

    return roleRoutes[roleGroup] || <Auth />; // Fallback in case of an unknown role
  }, [fullRouteList, isLoggedIn, isSubRole, roleGroup, routeList]);

  return <Suspense fallback={<FallbackPage />}>{renderRoutes}</Suspense>;
};

export default Routes;
