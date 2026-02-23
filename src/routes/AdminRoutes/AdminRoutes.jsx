import { useRoutes } from "react-router-dom";
import RootLayout from "@/app/RootLayout";
import { routes } from "../RouteLists/routes";
import {
  buildSidebarRoutes,
  filterRoutes,
  flattenRoutes,
} from "../helpers/routeAccessHelpers";

export default function AdminRoutes({ routeList }) {
  const adminRoutes = filterRoutes(routes?.admin, routeList);
  const adminRoutesFlat = flattenRoutes(adminRoutes);
  const adminSidebarRoutes = buildSidebarRoutes(adminRoutes);

  function AdminElements() {
    const element = useRoutes(adminRoutesFlat);
    return element;
  }

  return (
    <RootLayout sidebar={adminSidebarRoutes}>
      <AdminElements />
    </RootLayout>
  );
}
