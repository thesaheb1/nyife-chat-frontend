export const adminRoutesList = [
    {
        path: "/",
        pageKey: "admin_dashboard",
        permission: { view: "/" },
    },
    // ── Users ──────────────────────────────────────────────────
    {
        path: "/users",
        pageKey: "admin_users",
        permission: { view: "/users", update: "/users", create: "/users", delete: "/users" },
        child: [
            {
                path: "/users/:userId",
                pageKey: "admin_user_details",
                permission: { view: "/users/:userId", update: "/users/:userId", create: "/users/:userId", delete: "/users/:userId" },
            }
        ],
    },
    // ── Support ──────────────────────────────────────────────────
    {
        path: "/support",
        pageKey: "admin_support",
        permission: { view: "/support", update: "/support", create: "/support", delete: "/support" },
        child: [
            {
                path: "/support/:supportId",
                pageKey: "admin_support_details",
                permission: { view: "/support/:supportId", update: "/support/:supportId", create: "/support/:supportId", delete: "/support/:supportId" },
            }
        ],
    },
    // ── Subscription Plans ──────────────────────────────────────────────────
    {
        path: "/subscription-plans",
        permission: { view: "/subscription-plans", update: "/subscription-plans", create: "/subscription-plans", delete: "/subscription-plans" },
        pageKey: "admin_subscription_plans",
    },
    // ── Settings ──────────────────────────────────────────────────
    {
        pageKey: "admin_settings",
        child: [
            {
                path: "/general-settings",
                pageKey: "admin_general_settings",
                permission: {
                    create: "/general-settings",
                    view: "/general-settings",
                    update: "/general-settings",
                    delete: "/general-settings",
                },
            },
            {
                path: "/notification-settings",
                pageKey: "admin_notification_settings",
                permission: {
                    create: "/notification-settings",
                    view: "/notification-settings",
                    update: "/notification-settings",
                    delete: "/notification-settings",
                },
            }
        ],
    }
]

export const userRoutesList = [
    {
        path: "/",
        pageKey: "user_dashboard",
        permission: { view: "/" },
    },
    // ── Chat ──────────────────────────────────────────────────
    {
        path: "/chat",
        pageKey: "user_chat",
        permission: { view: "/chat", update: "/chat", create: "/chat", delete: "/chat" },
    },
    // ── Contacts ──────────────────────────────────────────────────
    {
        path: "/contacts",
        pageKey: "user_contacts",
        permission: { view: "/contacts", update: "/contacts", create: "/contacts", delete: "/contacts" },
    },
    // ── Templates ──────────────────────────────────────────────
    {
        path: "/templates",
        pageKey: "user_templates",
        permission: {
            view: "/templates",
            create: "/templates/create",
            update: "/templates/:templateId/update",
            delete: "/templates",
        },
        child: [
            {
                path: "/templates/create",
                pageKey: "user_create_template",

            },
            {
                path: "/templates/:templateId/update",
                pageKey: "user_update_template",
            }
        ],
    },
    // ── Flows ──────────────────────────────────────────────────
    {
        path: "/flows",
        pageKey: "user_flows",
        permission: {
            view: "/flows",
            create: "/flows/create",
            update: "/flows/:flowId/update",
            delete: "/flows",
        },
        child: [
            {
                path: "/flows/create",
                pageKey: "user_create_flow",
            },
            {
                path: "/flows/:flowId/update",
                pageKey: "user_update_flow",
            }
        ],
    },
    // ── Settings ──────────────────────────────────────────────────
    {
        pageKey: "user_settings",
        child: [
            {
                path: "/general-settings",
                pageKey: "user_general_settings",
                permission: {
                    create: "/general-settings",
                    view: "/general-settings",
                    update: "/general-settings",
                    delete: "/general-settings",
                },
            },
            {
                path: "/notification-settings",
                pageKey: "user_notification_settings",
                permission: {
                    create: "/notification-settings",
                    view: "/notification-settings",
                    update: "/notification-settings",
                    delete: "/notification-settings",
                },
            }
        ],
    },
]