// import { lazy } from "react";
// import { RouteIcons } from "../../constants/RouteIcons";
// const PageNotFound = lazy(() =>
//   import("@/components/page-not-found")
// );

// // Admin Routes
// const AdminDashboard = lazy(() => import("@/pages/admin/dashboard"));
// const AdminUsers = lazy(() => import("@/pages/admin/users"));
// const AdminUserDetails = lazy(() => import("@/pages/admin/users/user-details"));
// const AdminSupport = lazy(() => import("@/pages/admin/support"));
// const AdminSupportDetails = lazy(() => import("@/pages/admin/support/support-details"));
// const AdminSubscriptionPlans = lazy(() => import("@/pages/admin/subscription-plans"));
// const AdminProfile = lazy(() => import("@/pages/admin/profile"));

// // User Routes
// const UserDashboard = lazy(() => import("@/pages/user/dashboard"));
// const UserChat = lazy(() => import("@/pages/user/chat"));
// const UserContacts = lazy(() => import("@/pages/user/contacts"));
// const UserFlows = lazy(() => import("@/pages/user/flows"));
// const UserFlowsCreate = lazy(() => import("@/pages/user/flows/create-flows"));
// const UserFlowsUpdate = lazy(() => import("@/pages/user/flows/update-flows"));
// const UserTemplates = lazy(() => import("@/pages/user/template"));
// const UserTemplatesCreate = lazy(() => import("@/pages/user/template/create-template"));
// const UserTemplatesUpdate = lazy(() => import("@/pages/user/template/update-template"));
// const UserProfile = lazy(() => import("@/pages/user/profile"));


// export const adminRouteList = [
//   {
//     index: true,
//     element: AdminDashboard,
//     state: "Dashboard",
//   },
//   {
//     path: "/",
//     element: AdminDashboard,
//     state: "Dashboard",
//     permission: { view: "/" }, // can only view the dashboard
//     sidebarProps: {
//       displayText: "Dashboard",
//       icon: RouteIcons["Dashboard"],
//     },
//   },
//   {
//     path: "/users",
//     element: AdminUsers,
//     state: "Users",
//     permission: { view: "/users", update: "/users", create: "/users", delete: "/users" },
//     sidebarProps: {
//       displayText: "Users",
//       icon: RouteIcons["Users"],
//     },
//   },
//   {
//     path: "/users/:userId",
//     element: AdminUserDetails,
//     state: "User Details",
//   },
//   {
//     path: "/support",
//     element: AdminSupport,
//     state: "Support",
//     permission: { view: "/support", update: "/support", create: "/support", delete: "/support" },
//     sidebarProps: {
//       displayText: "Support",
//       icon: RouteIcons["Support"],
//     },
//   },
//   {
//     path: "/support/:supportId",
//     element: AdminSupportDetails,
//     state: "Support Details",
//   },
//   {
//     path: "/subscription-plans",
//     permission: { view: "/subscription-plans", update: "/subscription-plans", create: "/subscription-plans", delete: "/subscription-plans" },
//     element: AdminSubscriptionPlans,
//     state: "Subscription Plans",
//     sidebarProps: {
//       displayText: "Subscription Plans",
//       icon: RouteIcons["Subscription Plans"],
//     },
//   },
//   {
//     path: "/profile",
//     permission: { view: "/profile", update: "/profile" },
//     element: AdminProfile,
//     state: "Profile",
//   },
//   // AUTHENTICATION ROUTES
//   {
//     path: "/login",
//     redirectTo: "/",
//   },
//   {
//     path: "/forgot-password",
//     redirectTo: "/",
//   },
//   {
//     path: "/reset-password",
//     redirectTo: "/",
//   },
//   // PAGE NOT FOUND ROUTE
//   {
//     path: "*",
//     element: PageNotFound,
//     state: "Not Found",
//   },
// ];

// export const userRouteList = [
//   {
//     index: true,
//     element: UserDashboard,
//     state: "Dashboard",
//   },
//   {
//     path: "/",
//     element: UserDashboard,
//     state: "Dashboard",
//     permission: { view: "/" }, // can only view the dashboard
//     sidebarProps: {
//       displayText: "Dashboard",
//       icon: RouteIcons["Dashboard"],
//     },
//   },
//   {
//     path: "/chat",
//     element: UserChat,
//     state: "Chat",
//     permission: { view: "/chat", update: "/chat", create: "/chat", delete: "/chat" },
//     sidebarProps: {
//       displayText: "Chat",
//       icon: RouteIcons["Chat"],
//     },
//   },
//   {
//     path: "/contacts",
//     element: UserContacts,
//     state: "Contacts",
//     permission: { view: "/contacts", update: "/contacts", create: "/contacts", delete: "/contacts" },
//     sidebarProps: {
//       displayText: "Contacts",
//       icon: RouteIcons["Contacts"],
//     },
//   },
//   {
//     path: "/flows",
//     element: UserFlows,
//     state: "Flows",
//     permission: { view: "/flows", update: "/flows", create: "/flows", delete: "/flows" },
//     sidebarProps: {
//       displayText: "Flows",
//       icon: RouteIcons["Flows"],
//     },
//   },
//   {
//     path: "/flows/create-flows",
//     element: UserFlowsCreate,
//     state: "Create Flows",
//   },
//   {
//     path: "/flows/update-flows",
//     element: UserFlowsUpdate,
//     state: "Update Flows",
//   },
//   {
//     path: "/template",
//     element: UserTemplates,
//     state: "Templates",
//     permission: { view: "/template", update: "/template", create: "/template", delete: "/template" },
//     sidebarProps: {
//       displayText: "Templates",
//       icon: RouteIcons["Templates"],
//     },
//   },
//   {
//     path: "/template/create-template",
//     element: UserTemplatesCreate,
//     state: "Create Templates",
//   },
//   {
//     path: "/template/update-template",
//     element: UserTemplatesUpdate,
//     state: "Update Templates",
//   },
//   {
//     path: "/profile",
//     permission: { view: "/profile", update: "/profile" },
//     element: UserProfile,
//     state: "Profile",
//   },
//   // AUTHENTICATION ROUTES
//   {
//     path: "/login",
//     redirectTo: "/",
//   },
//   {
//     path: "/forgot-password",
//     redirectTo: "/",
//   },
//   {
//     path: "/reset-password",
//     redirectTo: "/",
//   },
//   // PAGE NOT FOUND ROUTE
//   {
//     path: "*",
//     element: PageNotFound,
//     state: "Not Found",
//   },
// ];





///////////////////////////////////////////////////////////////////////////////



import { lazy } from "react";
import { RouteIcons } from "../../constants/RouteIcons";
const PageNotFound = lazy(() =>
  import("@/components/page-not-found")
);

// Admin Routes
const AdminDashboard = lazy(() => import("@/pages/admin/dashboard"));
const AdminUsers = lazy(() => import("@/pages/admin/users"));
const AdminUserDetails = lazy(() => import("@/pages/admin/users/user-details"));
const AdminSupport = lazy(() => import("@/pages/admin/support"));
const AdminSupportDetails = lazy(() => import("@/pages/admin/support/support-details"));
const AdminSubscriptionPlans = lazy(() => import("@/pages/admin/subscription-plans"));
const AdminProfile = lazy(() => import("@/pages/admin/profile"));

// User Routes
const UserDashboard = lazy(() => import("@/pages/user/dashboard"));
const UserChat = lazy(() => import("@/pages/user/chat"));
const UserContacts = lazy(() => import("@/pages/user/contacts"));
const UserFlows = lazy(() => import("@/pages/user/flows"));
const UserFlowsCreate = lazy(() => import("@/pages/user/flows/create-flows"));
const UserFlowsUpdate = lazy(() => import("@/pages/user/flows/update-flows"));
const UserTemplates = lazy(() => import("@/pages/user/template"));
const UserTemplatesCreate = lazy(() => import("@/pages/user/template/create-template"));
const UserTemplatesUpdate = lazy(() => import("@/pages/user/template/update-template"));
const UserProfile = lazy(() => import("@/pages/user/profile"));


export const adminRouteList = [
  {
    index: true,
    element: AdminDashboard,
    state: "Dashboard",
  },
  {
    path: "/",
    element: AdminDashboard,
    state: "Dashboard",
    permission: { view: "/" },
    sidebarProps: {
      displayText: "Dashboard",
      icon: RouteIcons["Dashboard"],
    },
  },
  {
    path: "/users",
    element: AdminUsers,
    state: "Users",
    permission: { view: "/users", update: "/users", create: "/users", delete: "/users" },
    sidebarProps: {
      displayText: "Users",
      icon: RouteIcons["Users"],
    },
  },
  {
    path: "/users/:userId",
    element: AdminUserDetails,
    state: "User Details",
  },
  {
    path: "/support",
    element: AdminSupport,
    state: "Support",
    permission: { view: "/support", update: "/support", create: "/support", delete: "/support" },
    sidebarProps: {
      displayText: "Support",
      icon: RouteIcons["Support"],
    },
  },
  {
    path: "/support/:supportId",
    element: AdminSupportDetails,
    state: "Support Details",
  },
  {
    path: "/subscription-plans",
    permission: { view: "/subscription-plans", update: "/subscription-plans", create: "/subscription-plans", delete: "/subscription-plans" },
    element: AdminSubscriptionPlans,
    state: "Subscription Plans",
    sidebarProps: {
      displayText: "Subscription Plans",
      icon: RouteIcons["Subscription Plans"],
    },
  },
  {
    path: "/profile",
    permission: { view: "/profile", update: "/profile" },
    element: AdminProfile,
    state: "Profile",
  },
  // AUTHENTICATION ROUTES
  {
    path: "/login",
    redirectTo: "/",
  },
  {
    path: "/forgot-password",
    redirectTo: "/",
  },
  {
    path: "/reset-password",
    redirectTo: "/",
  },
  // PAGE NOT FOUND ROUTE
  {
    path: "*",
    element: PageNotFound,
    state: "Not Found",
  },
];

export const userRouteList = [
  {
    index: true,
    element: UserDashboard,
    state: "Dashboard",
  },
  {
    path: "/",
    element: UserDashboard,
    state: "Dashboard",
    permission: { view: "/" },
    sidebarProps: {
      displayText: "Dashboard",
      icon: RouteIcons["Dashboard"],
    },
  },
  {
    path: "/chat",
    element: UserChat,
    state: "Chat",
    permission: { view: "/chat", update: "/chat", create: "/chat", delete: "/chat" },
    sidebarProps: {
      displayText: "Chat",
      icon: RouteIcons["Chat"],
    },
  },
  {
    path: "/contacts",
    element: UserContacts,
    state: "Contacts",
    permission: { view: "/contacts", update: "/contacts", create: "/contacts", delete: "/contacts" },
    sidebarProps: {
      displayText: "Contacts",
      icon: RouteIcons["Contacts"],
    },
  },
  // ── Templates ──────────────────────────────────────────────
  {
    path: "/templates",
    element: UserTemplates,
    state: "Templates",
    permission: {
      view: "/templates",
      create: "/templates",
      update: "/templates",
      delete: "/templates",
    },
    sidebarProps: {
      displayText: "Templates",
      icon: RouteIcons["Templates"], // make sure to add this to RouteIcons
    },
  },
  {
    path: "/templates/create",
    element: UserTemplatesCreate,
    state: "Create Template",
  },
  {
    path: "/templates/:uuid/edit",
    element: UserTemplatesUpdate,
    state: "Edit Template",
  },
  // ── Flows ──────────────────────────────────────────────────
  {
    path: "/flows",
    element: UserFlows,
    state: "Flows",
    permission: {
      view: "/flows",
      create: "/flows",
      update: "/flows",
      delete: "/flows",
    },
    sidebarProps: {
      displayText: "Flows",
      icon: RouteIcons["Flows"],
    },
  },
  {
    path: "/flows/create",
    element: UserFlowsCreate,
    state: "Create Flow",
  },
  {
    path: "/flows/:flowId/edit",
    element: UserFlowsUpdate,
    state: "Edit Flow",
  },
  // ── Profile ───────────────────────────────────────────────
  {
    path: "/profile",
    permission: { view: "/profile", update: "/profile" },
    element: UserProfile,
    state: "Profile",
  },
  // AUTHENTICATION ROUTES
  {
    path: "/login",
    redirectTo: "/",
  },
  {
    path: "/forgot-password",
    redirectTo: "/",
  },
  {
    path: "/reset-password",
    redirectTo: "/",
  },
  // PAGE NOT FOUND ROUTE
  {
    path: "*",
    element: PageNotFound,
    state: "Not Found",
  },
];
