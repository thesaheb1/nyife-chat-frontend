import { Suspense, isValidElement } from "react";
import type { ComponentType } from "react";
import { Navigate } from "react-router-dom";
import { adminRouteList, userRouteList } from "./routeLists";
import FallbackPage from "@/components/fallback-page";
import type { AppRoute } from "../../helpers/routeAccessHelpers";

function renderRoutes(routes: AppRoute[]): AppRoute[] {
  return routes.map((route) => {
    if (route.redirectTo) {
      return { ...route, element: <Navigate to={route.redirectTo} replace /> };
    }

    const rawElement = route.element;
    const routeWithElement = rawElement && !isValidElement(rawElement)
      ? {
        ...route,
        element: (
          <Suspense fallback={<FallbackPage />}>
            {(() => {
              const Component = rawElement as ComponentType;
              return <Component />;
            })()}
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
