import { create } from 'zustand';

interface AppState {
  isOnline: boolean;
  pendingSyncCount: number;
  isPWAInstalled: boolean;
  showInstallPrompt: boolean;
  deferredPrompt: any;

  // Actions
  setOnlineStatus: (isOnline: boolean) => void;
  setPendingSyncCount: (count: number) => void;
  incrementPendingSyncCount: () => void;
  decrementPendingSyncCount: () => void;
  setPWAInstalled: (installed: boolean) => void;
  setShowInstallPrompt: (show: boolean) => void;
  setDeferredPrompt: (prompt: any) => void;
  installPWA: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  isOnline: navigator.onLine,
  pendingSyncCount: 0,
  isPWAInstalled: false,
  showInstallPrompt: false,
  deferredPrompt: null,

  setOnlineStatus: (isOnline) => set({ isOnline }),

  setPendingSyncCount: (count) => set({ pendingSyncCount: count }),

  incrementPendingSyncCount: () =>
    set((state) => ({ pendingSyncCount: state.pendingSyncCount + 1 })),

  decrementPendingSyncCount: () =>
    set((state) => ({
      pendingSyncCount: Math.max(0, state.pendingSyncCount - 1),
    })),

  setPWAInstalled: (installed) => set({ isPWAInstalled: installed }),

  setShowInstallPrompt: (show) => set({ showInstallPrompt: show }),

  setDeferredPrompt: (prompt) => set({ deferredPrompt: prompt }),

  installPWA: async () => {
    const { deferredPrompt } = get();
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      set({ isPWAInstalled: true, showInstallPrompt: false });
    }

    set({ deferredPrompt: null });
  },
}));

// Set up online/offline listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    useAppStore.getState().setOnlineStatus(true);
  });

  window.addEventListener('offline', () => {
    useAppStore.getState().setOnlineStatus(false);
  });

  // PWA install prompt listener
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    useAppStore.getState().setDeferredPrompt(e);
    useAppStore.getState().setShowInstallPrompt(true);
  });

  // Check if PWA is already installed
  window.addEventListener('appinstalled', () => {
    useAppStore.getState().setPWAInstalled(true);
    useAppStore.getState().setShowInstallPrompt(false);
  });

  // Check if running in standalone mode (PWA installed)
  if (window.matchMedia('(display-mode: standalone)').matches) {
    useAppStore.getState().setPWAInstalled(true);
  }
}
