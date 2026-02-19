import { useMemo } from "react";
import { useNavigate, type NavigateOptions, type To } from "react-router";

interface UseRouterReturn {
  /** Navigate to the previous history entry */
  back: () => void;
  /** Navigate to the next history entry */
  forward: () => void;
  /** Reload the current route */
  refresh: () => void;
  /** Push a new entry onto the history stack */
  push: (to: To, options?: Omit<NavigateOptions, "replace">) => void;
  /** Replace the current history entry */
  replace: (to: To, options?: NavigateOptions) => void;
}

export function useRouter(): UseRouterReturn {
  const navigate = useNavigate();

  return useMemo(
    () => ({
      back: () => navigate(-1),
      forward: () => navigate(1),
      refresh: () => navigate(0),
      push: (to: To, options?: Omit<NavigateOptions, "replace">) =>
        navigate(to, { ...options, replace: false }),
      replace: (to: To, options?: NavigateOptions) =>
        navigate(to, { ...options, replace: true }),
    }),
    [navigate]
  );
}