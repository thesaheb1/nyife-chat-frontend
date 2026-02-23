import type { ComponentType, ReactNode } from "react";

export type PermissionMap = Partial<Record<"view" | "create" | "update" | "delete", string>>;

export interface SidebarProps {
  displayText?: string;
  icon?: ReactNode;
}

export interface AppRoute {
  path?: string;
  element?: ComponentType | ReactNode;
  pageKey?: string;
  permission?: PermissionMap;
  sidebarProps?: SidebarProps;
  defaultRender?: boolean;
  redirectTo?: string;
  child?: AppRoute[];
}

export type SidebarRoute = Omit<AppRoute, "element" | "permission" | "defaultRender"> & {
  child?: SidebarRoute[];
};

const hasPermissionAccess = (
  routePermission?: PermissionMap,
  accessPermission?: PermissionMap
): boolean => {
  if (!routePermission) return true;
  if (!accessPermission) return false;

  const allowedPaths = new Set(Object.values(accessPermission));
  const routePaths = Object.values(routePermission);

  for (let i = 0; i < routePaths.length; i += 1) {
    if (allowedPaths.has(routePaths[i])) return true;
  }

  return false;
};

export const filterRoutes = (appRoutes: AppRoute[] = [], accessRoutes: AppRoute[] = []): AppRoute[] => {
  const accessMap = new Map<string, AppRoute>();
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

  const filterNode = (route: AppRoute): AppRoute | null => {
    const matchedAccess = route?.pageKey ? accessMap.get(route.pageKey) : undefined;
    const filteredChildren = Array.isArray(route?.child)
      ? route.child.map(filterNode).filter((child): child is AppRoute => child !== null)
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

  return appRoutes.map(filterNode).filter((route): route is AppRoute => route !== null);
};

export const buildSidebarRoutes = (routeTree: AppRoute[] = []): SidebarRoute[] => {
  return routeTree.map((route) => {
    const { element, permission, defaultRender, child, ...sidebarRoute } = route;
    const nextSidebarRoute: SidebarRoute = { ...sidebarRoute };

    if (Array.isArray(child) && child.length > 0) {
      nextSidebarRoute.child = buildSidebarRoutes(child);
    }

    return nextSidebarRoute;
  });
};

export const flattenRoutes = (routeTree: AppRoute[] = []): AppRoute[] => {
  const flat: AppRoute[] = [];
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
