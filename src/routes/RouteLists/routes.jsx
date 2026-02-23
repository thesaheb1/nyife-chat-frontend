import { Suspense } from "react";
import { Navigate } from "react-router-dom";
import { adminRouteList, userRouteList } from "./routeLists";
import FallbackPage from "@/components/fallback-page";

function renderRoutes(routes) {
  return routes.map((route) => {
    if (route.redirectTo) {
      return { ...route, element: <Navigate to={route.redirectTo} replace /> };
    }

    const Component = route.element;
    const routeWithElement = Component
      ? {
        ...route,
        element: (
          <Suspense fallback={<FallbackPage />}>
            <Component />
          </Suspense>
        ),
      }
      : { ...route };

    if (route.child) {
      return { ...routeWithElement, child: renderRoutes(route.child) };
    }

    return routeWithElement;
  });
}

export const routes = {
  admin: renderRoutes(adminRouteList),
  user: renderRoutes(userRouteList),
};
