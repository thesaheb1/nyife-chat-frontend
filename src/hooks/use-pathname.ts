import { useLocation } from "react-router";

/**
 * Returns the current pathname from the router.
 * Lightweight wrapper around useLocation for components
 * that only care about the pathname and nothing else.
 */
export function usePathname(): string {
  return useLocation().pathname;
}