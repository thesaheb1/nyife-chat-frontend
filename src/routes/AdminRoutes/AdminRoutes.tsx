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

interface AdminRoutesProps {
  routeList: AppRoute[];
}

export default function AdminRoutes({ routeList }: AdminRoutesProps) {
  const adminRoutes = filterRoutes(routes?.admin, routeList);
  const adminRoutesFlat = flattenRoutes(adminRoutes);
  const adminSidebarRoutes = buildSidebarRoutes(adminRoutes);

  function AdminElements() {
    const element = useRoutes(adminRoutesFlat as RouteObject[]);
    return element;
  }

  return (
    <RootLayout sidebar={adminSidebarRoutes}>
      <AdminElements />
    </RootLayout>
  );
}
