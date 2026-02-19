import { Suspense } from "react";
import { Navigate } from "react-router-dom";
import { adminRouteList, userRouteList } from "./routeLists";
import FallbackPage from "@/components/fallback-page";

function renderRoutes(routes) {
  return routes.map((route) => {
    if (route.redirectTo) {
      return { ...route, element: <Navigate to={route.redirectTo} replace /> };
    }

    if (route.child) {
      return { ...route, child: renderRoutes(route.child) };
    }

    const Component = route.element;
    return {
      ...route,
      element: (
        <Suspense fallback={<FallbackPage />}>
          <Component />
        </Suspense>
      ),
    };
  });
}

export const routes = {
  admin: renderRoutes(adminRouteList),
  user: renderRoutes(userRouteList),
};
