import { useRoutes } from "react-router-dom";
import RootLayout from "@/app/RootLayout";
import { routes } from "../RouteLists/routes";
import {
  buildSidebarRoutes,
  filterRoutes,
  flattenRoutes,
} from "../helpers/routeAccessHelpers";

export default function UserRoutes({ routeList }) {
  const userRoutes = filterRoutes(routes?.user, routeList);
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
