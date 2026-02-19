import { useRoutes } from "react-router-dom";
import RootLayout from "@/app/RootLayout";
import { routes } from "../RouteLists/routes";
let userRoutes = routes?.user;
let userRoutesFlat = routes?.user.flatMap((route) => route.child || [route]);
export function UserElements() {
  let element = useRoutes(userRoutesFlat);
  return element;
}

export default function UserRoutes() {
  return (
    <RootLayout sidebar={userRoutes}>
      <UserElements />
    </RootLayout>
  );
}
