import { useRoutes } from "react-router-dom";
import RootLayout from "@/app/RootLayout";
import { routes } from "../RouteLists/routes";
let adminRoutes = routes?.admin;
let adminRoutesFlat = routes?.admin.flatMap((route) => route.child || [route]);
export function AdminElements() {
  let element = useRoutes(adminRoutesFlat);
  return element;
}

export default function AdminRoutes() {
  return (
    <RootLayout sidebar={adminRoutes}>
      <AdminElements />
    </RootLayout>
  );
}
