import { useState, useEffect, useCallback } from "react";

interface UseInternetReturn {
  isOnline: boolean;
  refresh: () => boolean;
}

const getOnlineStatus = (): boolean =>
  typeof navigator !== "undefined" ? navigator.onLine : true;

export const useInternet = (): UseInternetReturn => {
  const [isOnline, setIsOnline] = useState<boolean>(getOnlineStatus);

  const refresh = useCallback((): boolean => {
    const status = getOnlineStatus();
    setIsOnline(status);
    return status;
  }, []);

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    // Sync state in case connection changed before mount
    setIsOnline(getOnlineStatus());

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  return { isOnline, refresh };
};