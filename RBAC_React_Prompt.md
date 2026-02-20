
## 🎯 ROLE & CONTEXT

You are a **Senior React.js Developer** with deep expertise in:
- `react-router-dom` v6+ (data routers, loaders, nested routes, `<Outlet />`)
- `@reduxjs/toolkit` (slices, thunks, `createSelector`, RTK Query)
- Role-Based Access Control (RBAC) design patterns
- Permission-driven UI rendering

---

## 📐 PROJECT OVERVIEW

Build a **complete, production-grade RBAC system** from scratch. The system has **two primary role families**:

| Family | Root Role | Can Create |
|--------|-----------|------------|
| Admin  | `admin`   | `subadmin` accounts |
| User   | `user`    | `subuser` accounts |

Each root role can create subordinate accounts with **granular, per-page CRUD permissions**.

---

## 🗂️ PAGE REGISTRY

Define a **central page registry** as the single source of truth for all pages in the system. Every page must have a unique `pageKey`.

### Admin Pages

| pageKey | Route | Display Name |
|---------|-------|--------------|
| `admin_dashboard` | `/admin/dashboard` | Admin Dashboard |
| `admin_users` | `/admin/users` | Users |
| `admin_support` | `/admin/support` | Support |
| `admin_subscription_plans` | `/admin/subscription-plans` | Subscription Plans |
| `admin_profile` | `/admin/profile` | Profile |
| `admin_access_control` | `/admin/access-control` | Access Control |

### User Pages

| pageKey | Route | Display Name |
|---------|-------|--------------|
| `user_dashboard` | `/user/dashboard` | User Dashboard |
| `user_chat` | `/user/chat` | Chat |
| `user_contacts` | `/user/contacts` | Contacts |
| `user_flows` | `/user/flows` | Flows |
| `user_template` | `/user/template` | Template |
| `user_profile` | `/user/profile` | Profile |
| `user_access_control` | `/user/access-control` | Access Control |

---

## 🔐 DATA MODELS

### 1. Permission Object
```typescript
interface PagePermission {
  view: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
}
```

### 2. Role Definition
```typescript
interface RoleDefinition {
  role_id: string;              // uuid
  role_title: string;           // e.g., "Support Staff"
  role_description: string;
  pages: {
    [pageKey: string]: PagePermission;
  };
}
```

### 3. Account / User Model
```typescript
interface Account {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string;             // hashed in real app, plain for mock
  account_type: 'admin' | 'subadmin' | 'user' | 'subuser';
  parent_id: string | null;     // null for root admin/user
  role: RoleDefinition | null;  // null for root admin/user (full access)
}
```

### Root accounts (`admin` and `user`) have `role: null`, meaning **full access to all pages with all permissions**.

---

## 🏗️ REDUX STORE ARCHITECTURE

Create the following Redux slices using `@reduxjs/toolkit`:

### `authSlice`
```typescript
interface AuthState {
  currentUser: Account | null;
  isAuthenticated: boolean;
  resolvedPages: ResolvedPages | null; // computed on login
}

// ResolvedPages: map of pageKey → PagePermission
// For root admin/user: all pages with all permissions = true
// For subadmin/subuser: only assigned pages with assigned permissions
type ResolvedPages = { [pageKey: string]: PagePermission };
```

**Actions:**
- `loginSuccess(account)` — set currentUser, compute and store `resolvedPages`
- `logout()` — clear state

**Key selector:**
```typescript
// Returns the permission object for a given page, or null if no access
selectPagePermission(state, pageKey: string): PagePermission | null
```

### `accountsSlice`
- Stores all accounts in mock data (or API)
- CRUD for subadmin/subuser accounts

### `rolesSlice`
- Stores role definitions
- CRUD for roles

---

## 🔄 LOGIN FLOW & PERMISSION RESOLUTION

When a user logs in:

1. Fetch the account by email + password.
2. Determine `account_type` (`admin`, `subadmin`, `user`, `subuser`).
3. **Resolve permissions:**
   - If `account_type` is `admin` or `user`: grant **all pages, all permissions = true**.
   - If `account_type` is `subadmin` or `subuser`: use `account.role.pages` directly as `resolvedPages`.
4. Store `resolvedPages` in Redux `authSlice`.
5. Redirect to the **first page the user has `view: true` access to**.

---

## 🛣️ ROUTING ARCHITECTURE

Use `react-router-dom` v6 with nested routes.

### Route Protection Rules:

1. **`<PrivateRoute />`** — Checks `isAuthenticated`. Redirects to `/login` if not.
2. **`<PermissionRoute pageKey={string} />`** — Checks `resolvedPages[pageKey]?.view === true`. Shows a `403 Access Denied` page if false.
3. **Lazy load every page component** using `React.lazy` + `Suspense`. Only pages the user can access should be loadable.

### Route Structure:
```
/login                          → LoginPage (public)
/admin/*                        → PrivateRoute → AdminLayout
    /admin/dashboard            → PermissionRoute(admin_dashboard) → AdminDashboard
    /admin/users                → PermissionRoute(admin_users) → AdminUsers
    /admin/support              → PermissionRoute(admin_support) → AdminSupport
    /admin/subscription-plans   → PermissionRoute(admin_subscription_plans) → AdminSubscriptionPlans
    /admin/profile              → PermissionRoute(admin_profile) → AdminProfile
    /admin/access-control       → PermissionRoute(admin_access_control) → AdminAccessControl
/user/*                         → PrivateRoute → UserLayout
    /user/dashboard             → PermissionRoute(user_dashboard) → UserDashboard
    /user/chat                  → PermissionRoute(user_chat) → UserChat
    /user/contacts              → PermissionRoute(user_contacts) → UserContacts
    /user/flows                 → PermissionRoute(user_flows) → UserFlows
    /user/template              → PermissionRoute(user_template) → UserTemplate
    /user/profile               → PermissionRoute(user_profile) → UserProfile
    /user/access-control        → PermissionRoute(user_access_control) → UserAccessControl
```

---

## 🧭 DYNAMIC SIDEBAR

The sidebar **must be fully permission-driven**:

1. Import the central page registry.
2. Filter registry pages by `resolvedPages` — only include pages where `view === true`.
3. Render **only those nav items** that the logged-in account has view access to.
4. The sidebar must reactively update if permissions change (e.g., after re-login).

```typescript
// Example sidebar logic
const sidebarItems = ALL_PAGES_FOR_FAMILY.filter(
  (page) => resolvedPages?.[page.pageKey]?.view === true
);
```

---

## 🧩 PERMISSION-AWARE UI HOOK

Create a custom hook `usePagePermission(pageKey: string)` that returns the permission object for the current page. Use this everywhere in page components to conditionally render action buttons.

```typescript
// Hook definition
export function usePagePermission(pageKey: string): PagePermission {
  const permission = useSelector((state) => selectPagePermission(state, pageKey));
  return permission ?? { view: false, create: false, update: false, delete: false };
}

// Usage inside any page component
const { create, update, delete: canDelete } = usePagePermission('admin_support');

return (
  <>
    {create && <Button>Create Ticket</Button>}
    {update && <Button>Edit Ticket</Button>}
    {canDelete && <Button>Delete Ticket</Button>}
  </>
);
```

---

## 👤 ACCESS CONTROL PAGE (Admin & User)

This is the page where root `admin` / root `user` creates subordinate accounts.

### Form Fields:
- `name` (string, required)
- `email` (string, required, unique)
- `phone` (string, required)
- `default_password` (string, required)
- `role_title` (string, required)
- `role_description` (string, required)
- **Page Permissions Table** — a dynamic table listing every page in the role family with toggle switches for `View`, `Create`, `Update`, `Delete` per page.

### Permission Table UI:

| Page Name | View | Create | Update | Delete |
|-----------|------|--------|--------|--------|
| Admin Support | ✅ | ❌ | ✅ | ❌ |
| Admin Dashboard | ❌ | ❌ | ❌ | ❌ |

- `View` toggle, when **disabled**, must **automatically disable and uncheck** Create, Update, and Delete (you can't act on a page you can't see).
- Each row in the table maps to a `pageKey`.

### Submit:
On submit, create an `Account` object with the role embedded. Store it in Redux (`accountsSlice`).

---

## 🔒 SUBADMIN / SUBUSER CONSTRAINTS

| Scenario | Behavior |
|----------|----------|
| Subadmin(B) has only `admin_support` with `view + update` | Sidebar shows only "Support". Page loads. No Create/Delete buttons visible. |
| Subadmin(B) tries to navigate to `/admin/dashboard` manually | `PermissionRoute` blocks it and shows 403 page. |
| Subuser(B) has only `user_dashboard` with `view` only | Sidebar shows only "Dashboard". No Edit buttons. |
| Root admin logs in | Full sidebar, all pages, all buttons visible. |

---

## 📁 FOLDER STRUCTURE

```
src/
├── app/
│   └── store.ts
├── features/
│   ├── auth/
│   │   ├── authSlice.ts
│   │   ├── LoginPage.tsx
│   │   └── hooks/useAuth.ts
│   ├── accounts/
│   │   ├── accountsSlice.ts
│   │   └── AccessControlPage.tsx
│   └── roles/
│       └── rolesSlice.ts
├── router/
│   ├── AppRouter.tsx
│   ├── PrivateRoute.tsx
│   └── PermissionRoute.tsx
├── layouts/
│   ├── AdminLayout.tsx     (sidebar + outlet)
│   └── UserLayout.tsx
├── constants/
│   └── pageRegistry.ts     (single source of truth for all pages)
├── hooks/
│   └── usePagePermission.ts
├── pages/
│   ├── admin/
│   │   ├── AdminDashboard.tsx
│   │   ├── AdminUsers.tsx
│   │   ├── AdminSupport.tsx
│   │   ├── AdminSubscriptionPlans.tsx
│   │   ├── AdminProfile.tsx
│   │   └── AdminAccessControl.tsx
│   ├── user/
│   │   ├── UserDashboard.tsx
│   │   ├── UserChat.tsx
│   │   ├── UserContacts.tsx
│   │   ├── UserFlows.tsx
│   │   ├── UserTemplate.tsx
│   │   ├── UserProfile.tsx
│   │   └── UserAccessControl.tsx
│   └── shared/
│       ├── NotFound.tsx
│       └── AccessDenied.tsx
└── mock/
    └── mockAccounts.ts     (seed data for testing)
```

---

## 🧪 MOCK SEED DATA

Include the following test accounts for immediate testing:

```typescript
const mockAccounts: Account[] = [
  {
    id: '1', name: 'Super Admin', email: 'admin@test.com', phone: '0000000000',
    password: 'admin123', account_type: 'admin', parent_id: null, role: null
  },
  {
    id: '2', name: 'Root User', email: 'user@test.com', phone: '1111111111',
    password: 'user123', account_type: 'user', parent_id: null, role: null
  },
  {
    id: '3', name: 'Support Staff', email: 'support@test.com', phone: '2222222222',
    password: 'support123', account_type: 'subadmin', parent_id: '1',
    role: {
      role_id: 'r1', role_title: 'Support Staff',
      role_description: 'Only handles support tickets',
      pages: {
        admin_support: { view: true, create: false, update: true, delete: false }
      }
    }
  },
  {
    id: '4', name: 'Customer', email: 'customer@test.com', phone: '3333333333',
    password: 'customer123', account_type: 'subuser', parent_id: '2',
    role: {
      role_id: 'r2', role_title: 'Customer',
      role_description: 'View-only dashboard access',
      pages: {
        user_dashboard: { view: true, create: false, update: false, delete: false }
      }
    }
  }
];
```

---

## ✅ IMPLEMENTATION CHECKLIST

Before considering the implementation complete, verify:

- [ ] `pageRegistry.ts` is the single source of truth — no hardcoded page lists elsewhere
- [ ] Root `admin`/`user` always gets full access without any role object
- [ ] `resolvedPages` is computed once at login and stored in Redux
- [ ] `PermissionRoute` blocks navigation AND lazy loading for unauthorized pages
- [ ] Sidebar filters pages dynamically from `resolvedPages`
- [ ] `usePagePermission` hook is used in **every** page to guard action buttons
- [ ] Access Control page correctly builds the role object from the permission table
- [ ] View toggle disabling cascades to Create/Update/Delete toggles in the form
- [ ] All 4 mock accounts work correctly with expected behavior
- [ ] `403 AccessDenied` page shown for unauthorized manual URL access
- [ ] No TypeScript errors (`strict: true`)

---

## ⚠️ CRITICAL CONSTRAINTS

1. **Do NOT use any third-party RBAC library** (like `casl`). Implement from scratch.
2. **TypeScript strict mode** must be enabled and all types must be explicit.
3. Use **only** `@reduxjs/toolkit` for state — no `useContext` for auth/permissions.
4. Page components must use **`React.lazy`** for code splitting.
5. The permission check must be a **centralized, reusable pattern** — not scattered ad-hoc conditionals.
6. Sidebar and routes must derive from the same `pageRegistry` — no duplication.

---

*Start by creating `pageRegistry.ts`, then `authSlice.ts` with `resolvedPages` logic, then the router, then layouts, then pages.*
