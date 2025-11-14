/**
 * ============================================================================
 * USE NETWORK STATUS HOOK
 * ============================================================================
 *
 * Hook pour détecter l'état de la connexion réseau
 */

import { useState, useEffect } from 'react';

export interface NetworkStatus {
  isOnline: boolean;
  effectiveType?: string; // '4g', '3g', '2g', 'slow-2g'
  downlink?: number; // Mbps
  rtt?: number; // Round-trip time in ms
  saveData?: boolean; // Data saver mode
}

export const useNetworkStatus = (): NetworkStatus => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
  });

  useEffect(() => {
    const updateNetworkStatus = () => {
      const connection = (navigator as any).connection ||
        (navigator as any).mozConnection ||
        (navigator as any).webkitConnection;

      setNetworkStatus({
        isOnline: navigator.onLine,
        effectiveType: connection?.effectiveType,
        downlink: connection?.downlink,
        rtt: connection?.rtt,
        saveData: connection?.saveData,
      });
    };

    // Écouter les changements de connexion
    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);

    // Écouter les changements de Network Information API
    const connection = (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection;

    if (connection) {
      connection.addEventListener('change', updateNetworkStatus);
    }

    // Initial update
    updateNetworkStatus();

    // Cleanup
    return () => {
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);
      if (connection) {
        connection.removeEventListener('change', updateNetworkStatus);
      }
    };
  }, []);

  return networkStatus;
};

/**
 * Hook pour détecter uniquement si on est en ligne
 */
export const useIsOnline = (): boolean => {
  const { isOnline } = useNetworkStatus();
  return isOnline;
};
