import { lazy } from "react";
import { RouteIcons } from "@/constants/RouteIcons";
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
const AdminGeneralSettings = lazy(() => import("@/pages/admin/settings/general"));
const AdminNotificationSettings = lazy(() => import("@/pages/admin/settings/notification"));
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
const UserGeneralSettings = lazy(() => import("@/pages/user/settings/general"));
const UserNotificationSettings = lazy(() => import("@/pages/user/settings/notification"));
const UserProfile = lazy(() => import("@/pages/user/profile"));


export const adminRouteList = [
  {
    path: "/",
    element: AdminDashboard,
    pageKey: "admin_dashboard",
    permission: { view: "/" }, // can only view the dashboard on (/) route
    sidebarProps: {
      displayText: "Dashboard",
      icon: RouteIcons["Dashboard"],
    },
    defaultRender: false, // means that the route will not be rendered by default (only if the user has access)
  },
  // ── Users ──────────────────────────────────────────────────
  {
    path: "/users",
    element: AdminUsers,
    pageKey: "admin_users",
    permission: { view: "/users", update: "/users", create: "/users", delete: "/users" }, // can view, update, create, delete users on (/users) route
    sidebarProps: {
      displayText: "Users",
      icon: RouteIcons["Users"],
    },
    defaultRender: false,
    child: [
      {
        path: "/users/:userId",
        element: AdminUserDetails,
        pageKey: "admin_user_details",
        permission: { view: "/users/:userId", update: "/users/:userId", create: "/users/:userId", delete: "/users/:userId" }, // same as above
        defaultRender: false,
      }
    ],
  },
  // ── Support ──────────────────────────────────────────────────
  {
    path: "/support",
    element: AdminSupport,
    pageKey: "admin_support",
    permission: { view: "/support", update: "/support", create: "/support", delete: "/support" }, // same as above
    sidebarProps: {
      displayText: "Support",
      icon: RouteIcons["Support"],
    },
    defaultRender: false,
    child: [
      {
        path: "/support/:supportId",
        element: AdminSupportDetails,
        pageKey: "admin_support_details",
        permission: { view: "/support/:supportId", update: "/support/:supportId", create: "/support/:supportId", delete: "/support/:supportId" },
        defaultRender: false,
      }
    ],
  },
  // ── Subscription Plans ──────────────────────────────────────────────────
  {
    path: "/subscription-plans",
    permission: { view: "/subscription-plans", update: "/subscription-plans", create: "/subscription-plans", delete: "/subscription-plans" },
    element: AdminSubscriptionPlans,
    pageKey: "admin_subscription_plans",
    sidebarProps: {
      displayText: "admin_Subscription Plans",
      icon: RouteIcons["Subscription Plans"],
    },
    defaultRender: false,
  },
  // ── Settings ──────────────────────────────────────────────────
  {
    sidebarProps: {
      displayText: "Settings",
      icon: RouteIcons["Settings"],
    },
    pageKey: "admin_settings",
    child: [
      {
        path: "/general-settings",
        element: AdminGeneralSettings,
        pageKey: "admin_general_settings",
        permission: {
          create: "/general-settings",
          view: "/general-settings",
          update: "/general-settings",
          delete: "/general-settings",
        },
        sidebarProps: {
          displayText: "General Settings",
          icon: RouteIcons["Settings"],
        },
        defaultRender: false,
      },
      {
        path: "/notification-settings",
        element: AdminNotificationSettings,
        pageKey: "admin_notification_settings",
        permission: {
          create: "/notification-settings",
          view: "/notification-settings",
          update: "/notification-settings",
          delete: "/notification-settings",
        },
        sidebarProps: {
          displayText: "General Settings",
          icon: RouteIcons["Settings"],
        },
        defaultRender: false,
      }
    ],
  },
  // ── Profile ─────────────────────────────────────────────────────
  {
    path: "/profile",
    permission: { view: "/profile", update: "/profile" },
    element: AdminProfile,
    pageKey: "admin_profile",
    defaultRender: true, // means that the route will be rendered by default (even user has no access)
  },
  // ── Authentication Routes ─────────────────────────────────────────
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
  // ── Page Not Found ──────────────────────────────────────────────────
  {
    path: "*",
    element: PageNotFound,
    pageKey: "admin_not_found_page",
    defaultRender: true,
  },
];

export const userRouteList = [
  {
    path: "/",
    element: UserDashboard,
    pageKey: "user_dashboard",
    permission: { view: "/" },
    sidebarProps: {
      displayText: "Dashboard",
      icon: RouteIcons["Dashboard"],
    },
    defaultRender: false,
  },
  // ── Chat ──────────────────────────────────────────────────
  {
    path: "/chat",
    element: UserChat,
    pageKey: "user_chat",
    permission: { view: "/chat", update: "/chat", create: "/chat", delete: "/chat" },
    sidebarProps: {
      displayText: "Chat",
      icon: RouteIcons["Chat"],
    },
    defaultRender: false,
  },
  // ── Contacts ──────────────────────────────────────────────────
  {
    path: "/contacts",
    element: UserContacts,
    pageKey: "user_contacts",
    permission: { view: "/contacts", update: "/contacts", create: "/contacts", delete: "/contacts" },
    sidebarProps: {
      displayText: "Contacts",
      icon: RouteIcons["Contacts"],
    },
    defaultRender: false,
  },
  // ── Templates ──────────────────────────────────────────────
  {
    path: "/templates",
    element: UserTemplates,
    pageKey: "user_templates",
    permission: {
      view: "/templates",
      create: "/templates/create",
      update: "/templates/:templateId/update",
      delete: "/templates",
    },
    sidebarProps: {
      displayText: "Templates",
      icon: RouteIcons["Templates"], // make sure to add this to RouteIcons
    },
    defaultRender: false,
    child: [
      {
        path: "/templates/create",
        element: UserTemplatesCreate,
        pageKey: "user_create_template",
        defaultRender: false

      },
      {
        path: "/templates/:templateId/update",
        element: UserTemplatesUpdate,
        pageKey: "user_update_template",
        defaultRender: false
      }
    ],
  },
  // ── Flows ──────────────────────────────────────────────────
  {
    path: "/flows",
    element: UserFlows,
    pageKey: "user_flows",
    permission: {
      view: "/flows",
      create: "/flows/create",
      update: "/flows/:flowId/update",
      delete: "/flows",
    },
    sidebarProps: {
      displayText: "Flows",
      icon: RouteIcons["Flows"],
    },
    defaultRender: false,
    child: [
      {
        path: "/flows/create",
        element: UserFlowsCreate,
        pageKey: "user_create_flow",
        defaultRender: false
      },
      {
        path: "/flows/:flowId/update",
        element: UserFlowsUpdate,
        pageKey: "user_update_flow",
        defaultRender: false
      }
    ],
  },
  // ── Settings ──────────────────────────────────────────────────
  {
    sidebarProps: {
      displayText: "Settings",
      icon: RouteIcons["Settings"],
    },
    pageKey: "user_settings",
    child: [
      {
        path: "/general-settings",
        element: UserGeneralSettings,
        pageKey: "user_general_settings",
        permission: {
          create: "/general-settings",
          view: "/general-settings",
          update: "/general-settings",
          delete: "/general-settings",
        },
        sidebarProps: {
          displayText: "General Settings",
          icon: RouteIcons["Settings"],
        },
        defaultRender: false,
      },
      {
        path: "/notification-settings",
        element: UserNotificationSettings,
        pageKey: "user_notification_settings",
        permission: {
          create: "/notification-settings",
          view: "/notification-settings",
          update: "/notification-settings",
          delete: "/notification-settings",
        },
        sidebarProps: {
          displayText: "Notification Settings",
          icon: RouteIcons["Settings"],
        },
        defaultRender: false,
      }
    ],
  },
  // ── Profile ─────────────────────────────────────────────────────
  {
    path: "/profile",
    permission: { view: "/profile", update: "/profile" },
    element: UserProfile,
    pageKey: "user_profile",
    defaultRender: true,
  },
  // ── Authentication Routes ─────────────────────────────────────────
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
  // ── Page Not Found ──────────────────────────────────────────────────
  {
    path: "*",
    element: PageNotFound,
    pageKey: "user_not_found_page",
    defaultRender: true,
  },
];
