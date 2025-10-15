import React, { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";

/**
 * OfflineIndicator component that detects and displays offline status.
 * Shows a banner at the top of the page when internet connection is lost.
 *
 * Uses the browser's online/offline events to detect connectivity changes.
 */
export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Set initial state
    setIsOnline(navigator.onLine);

    // Handler for online event
    const handleOnline = () => setIsOnline(true);

    // Handler for offline event
    const handleOffline = () => setIsOnline(false);

    // Listen to online/offline events
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Cleanup listeners on unmount
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Don't render anything if online
  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 p-4">
      <Alert variant="destructive" className="bg-red-900/90 border-red-800 text-white backdrop-blur-sm">
        <AlertDescription className="flex items-center justify-center gap-2">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
            />
          </svg>
          <span className="font-medium">Brak połączenia z internetem</span>
        </AlertDescription>
      </Alert>
    </div>
  );
};

