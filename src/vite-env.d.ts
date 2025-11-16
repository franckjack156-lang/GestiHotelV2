/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

// Déclaration pour le module virtual de vite-plugin-pwa
declare module 'virtual:pwa-register/react' {
  import type { Ref } from 'react';

  export interface RegisterSWOptions {
    immediate?: boolean;
    onNeedRefresh?: () => void;
    onOfflineReady?: () => void;
    onRegistered?: (registration: ServiceWorkerRegistration | undefined) => void;
    onRegisterError?: (error: any) => void;
  }

  export function useRegisterSW(options?: RegisterSWOptions): {
    needRefresh: [boolean, (value: boolean) => void];
    offlineReady: [boolean, (value: boolean) => void];
    updateServiceWorker: (reloadPage?: boolean) => Promise<void>;
  };
}
