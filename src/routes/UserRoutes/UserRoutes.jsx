import { useRoutes } from "react-router-dom";
import RootLayout from "@/app/RootLayout";
import { routes } from "../RouteLists/routes";

const filterRoutes = (appRoutes = [], accessRoutes = []) => {
  const accessMap = new Map();
  const stack = [...accessRoutes];

  while (stack.length) {
    const current = stack.pop();
    if (!current) continue;

    if (current.pageKey) {
      accessMap.set(current.pageKey, current);
    }

    if (Array.isArray(current.child) && current.child.length > 0) {
      stack.push(...current.child);
    }
  }

  const hasPermissionAccess = (routePermission, accessPermission) => {
    if (!routePermission) return true;
    if (!accessPermission) return false;

    const allowedPaths = new Set(Object.values(accessPermission));
    const routePaths = Object.values(routePermission);

    for (let i = 0; i < routePaths.length; i += 1) {
      if (allowedPaths.has(routePaths[i])) return true;
    }

    return false;
  };

  const filterNode = (route) => {
    const matchedAccess = route?.pageKey ? accessMap.get(route.pageKey) : undefined;
    const filteredChildren = Array.isArray(route?.child)
      ? route.child.map(filterNode).filter(Boolean)
      : undefined;

    const selfAllowed = Boolean(
      route?.defaultRender ||
      (matchedAccess && hasPermissionAccess(route.permission, matchedAccess.permission))
    );
    const hasAllowedChildren = Boolean(filteredChildren && filteredChildren.length);

    if (!selfAllowed && !hasAllowedChildren) return null;

    const nextRoute = { ...route };

    if (hasAllowedChildren) {
      nextRoute.child = filteredChildren;
    } else if (nextRoute.child) {
      delete nextRoute.child;
    }

    return nextRoute;
  };

  return appRoutes.map(filterNode).filter(Boolean);
};

export default function UserRoutes({ routeList }) {
  const userRoutes = filterRoutes(routes?.user, routeList);

  const buildSidebarRoutes = (routeTree = []) => {
    return routeTree.map((route) => {
      const { element, permission, defaultRender, child, ...sidebarRoute } = route;

      if (Array.isArray(child) && child.length > 0) {
        sidebarRoute.child = buildSidebarRoutes(child);
      }

      return sidebarRoute;
    });
  };

  const flattenRoutes = (routeTree = []) => {
    const flat = [];
    const stack = [...routeTree];

    while (stack.length) {
      const current = stack.pop();
      if (!current) continue;

      if (current.path) {
        flat.push(current);
      }

      if (Array.isArray(current.child) && current.child.length > 0) {
        stack.push(...current.child);
      }
    }

    return flat;
  };

  const userRoutesFlat = flattenRoutes(userRoutes);
  const userSidebarRoutes = buildSidebarRoutes(userRoutes);

  function UserElements() {
    const element = useRoutes(userRoutesFlat);
    return element;
  };

  return (
    <RootLayout sidebar={userSidebarRoutes}>
      <UserElements />
    </RootLayout>
  );
}
