import { useRoutes } from "react-router-dom";
import type { RouteObject } from "react-router-dom";
import RootLayout from "@/app/RootLayout";
import { routes } from "../RouteLists/routes";
import {
  type AppRoute,
  buildSidebarRoutes,
  filterRoutes,
  flattenRoutes,
} from "../../helpers/routeAccessHelpers";

interface UserRoutesProps {
  routeList: AppRoute[];
}

export default function UserRoutes({ routeList }: UserRoutesProps) {
  const userRoutes = filterRoutes(routes?.user, routeList);
  const userRoutesFlat = flattenRoutes(userRoutes);
  const userSidebarRoutes = buildSidebarRoutes(userRoutes);

  function UserElements() {
    const element = useRoutes(userRoutesFlat as RouteObject[]);
    return element;
  }

  return (
    <RootLayout sidebar={userSidebarRoutes}>
      <UserElements />
    </RootLayout>
  );
}
