// Breadcrumbs.tsx
// Production-ready breadcrumb with:
// - Automatic ID/UUID segment skipping
// - Custom label overrides per route segment
// - Collapse with dropdown for long paths
// - Home icon + separator
// - Zero config needed — just drop in

import { Link, useLocation } from "react-router-dom"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Home, ChevronDown, Ellipsis } from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

export type BreadcrumbsProps = {
    /**
     * Override the segments entirely. If omitted, parsed from current URL.
     */
    segments?: string[]

    /**
     * Strip a base path prefix from the URL before parsing segments.
     * e.g. basePath="/app" turns "/app/templates/update" → "templates/update"
     */
    basePath?: string

    /**
     * How many segments to show before collapsing middle segments into a dropdown.
     * Counts Home as a segment. Default: 4
     */
    collapseAfter?: number

    /**
     * Custom display labels per segment slug.
     * Keys are the raw URL segment (lowercased), values are the display label.
     * e.g. { "mgmt": "Management", "orgs": "Organisations" }
     */
    labelMap?: Record<string, string>

    /**
     * Show the home icon + "Home" breadcrumb. Default: true
     */
    showHome?: boolean

    /**
     * The href for the home crumb. Default: "/"
     */
    homeHref?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** UUID v4 pattern */
const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Pure numeric segment (e.g. resource IDs like /users/42) */
const NUMERIC_RE = /^\d+$/

/** Mongo ObjectId-style (24-char hex) */
const OBJECTID_RE = /^[0-9a-f]{24}$/i

/** Short hash-like ID (8–12 hex chars) */
const SHORT_HASH_RE = /^[0-9a-f]{8,12}$/i

function isIdSegment(segment: string): boolean {
    return (
        UUID_RE.test(segment) ||
        NUMERIC_RE.test(segment) ||
        OBJECTID_RE.test(segment) ||
        SHORT_HASH_RE.test(segment)
    )
}

function formatLabel(segment: string, labelMap?: Record<string, string>): string {
    const key = segment.toLowerCase()
    if (labelMap?.[key]) return labelMap[key]
    return segment
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Breadcrumbs({
    segments: segmentsProp,
    basePath = "",
    collapseAfter = 4,
    labelMap,
    showHome = true,
    homeHref = "/",
}: BreadcrumbsProps) {
    const location = useLocation()

    // 1. Resolve raw segments
    const rawParts = segmentsProp
        ?? location.pathname.replace(basePath, "").split("/").filter(Boolean)

    // 2. Filter out ID-like segments, keeping track of cumulative path for hrefs
    type Crumb = { label: string; href: string }

    const crumbs: Crumb[] = []
    const accumulated: string[] = []

    for (const part of rawParts) {
        accumulated.push(part)
        if (isIdSegment(part)) continue          // skip but keep href cursor moving
        crumbs.push({
            label: formatLabel(part, labelMap),
            href: basePath + "/" + accumulated.join("/"),
        })
    }

    // 3. Collapse logic — collapseAfter counts crumbs only (Home excluded from count)
    const totalVisible = showHome ? crumbs.length + 1 : crumbs.length
    const shouldCollapse = totalVisible > collapseAfter

    // When collapsing:
    //   Home  …dropdown(middle crumbs)…  Last
    //   We always show first crumb after Home + last crumb
    const firstCrumb = crumbs[0]
    const lastCrumb = crumbs[crumbs.length - 1]
    const middleCrumbs = crumbs.slice(1, -1)

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <Breadcrumb className="container">
            <BreadcrumbList>

                {/* Home */}
                {showHome && (
                    <>
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link
                                    to={homeHref}
                                    className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                                    aria-label="Home"
                                >
                                    <Home className="h-4 w-4 shrink-0" />
                                    <span className="sr-only">Home</span>
                                </Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        {crumbs.length > 0 && <BreadcrumbSeparator />}
                    </>
                )}

                {/* No extra crumbs — nothing more to render */}
                {crumbs.length === 0 && null}

                {/* ── Collapsed layout ── */}
                {shouldCollapse && crumbs.length > 0 && (
                    <>
                        {/* First crumb always visible */}
                        {firstCrumb && (
                            <>
                                <BreadcrumbItem>
                                    <BreadcrumbLink asChild>
                                        <Link
                                            to={firstCrumb.href}
                                            className="text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {firstCrumb.label}
                                        </Link>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator />
                            </>
                        )}

                        {/* Middle crumbs collapsed into dropdown */}
                        {middleCrumbs.length > 0 && (
                            <>
                                <BreadcrumbItem>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors focus:outline-none">
                                            <Ellipsis className="h-4 w-4" />
                                            <ChevronDown className="h-3 w-3" />
                                            <span className="sr-only">Show more breadcrumbs</span>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="start">
                                            {middleCrumbs.map((crumb) => (
                                                <DropdownMenuItem key={crumb.href} asChild>
                                                    <Link to={crumb.href}>{crumb.label}</Link>
                                                </DropdownMenuItem>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator />
                            </>
                        )}

                        {/* Last crumb — always the current page */}
                        {lastCrumb && crumbs.length > 1 && (
                            <BreadcrumbItem>
                                <BreadcrumbPage>{lastCrumb.label}</BreadcrumbPage>
                            </BreadcrumbItem>
                        )}

                        {/* Edge case: only 1 crumb total (just show as page) */}
                        {crumbs.length === 1 && firstCrumb && (
                            <BreadcrumbItem>
                                <BreadcrumbPage>{firstCrumb.label}</BreadcrumbPage>
                            </BreadcrumbItem>
                        )}
                    </>
                )}

                {/* ── Non-collapsed layout ── */}
                {!shouldCollapse && crumbs.map((crumb, index) => {
                    const isLast = index === crumbs.length - 1
                    return (
                        <span key={crumb.href} className="contents">
                            <BreadcrumbItem>
                                {isLast ? (
                                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                                ) : (
                                    <BreadcrumbLink asChild>
                                        <Link
                                            to={crumb.href}
                                            className="text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {crumb.label}
                                        </Link>
                                    </BreadcrumbLink>
                                )}
                            </BreadcrumbItem>
                            {!isLast && <BreadcrumbSeparator />}
                        </span>
                    )
                })}

            </BreadcrumbList>
        </Breadcrumb>
    )
}
