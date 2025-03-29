import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserPreferences } from '@shared/schema';

interface SettingsState {
  language: 'en' | 'fr';
  theme: 'dark' | 'light';
  audioQuality: 'standard' | 'high' | 'lossless';
  autoplay: boolean;
  notifications: {
    email: boolean;
    push: boolean;
    newReleases: boolean;
    playlists: boolean;
  };
  
  setLanguage: (language: 'en' | 'fr') => void;
  setTheme: (theme: 'dark' | 'light') => void;
  setAudioQuality: (quality: 'standard' | 'high' | 'lossless') => void;
  setAutoplay: (autoplay: boolean) => void;
  setNotificationSetting: (key: keyof SettingsState['notifications'], value: boolean) => void;
  updateAllSettings: (preferences: Partial<UserPreferences>) => void;
  resetSettings: () => void;
}

const defaultSettings: Omit<SettingsState, 
  'setLanguage' | 'setTheme' | 'setAudioQuality' | 'setAutoplay' | 
  'setNotificationSetting' | 'updateAllSettings' | 'resetSettings'
> = {
  language: 'en',
  theme: 'dark',
  audioQuality: 'standard',
  autoplay: true,
  notifications: {
    email: true,
    push: true,
    newReleases: true,
    playlists: true,
  }
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,
      
      setLanguage: (language) => set({ language }),
      
      setTheme: (theme) => set({ theme }),
      
      setAudioQuality: (audioQuality) => set({ audioQuality }),
      
      setAutoplay: (autoplay) => set({ autoplay }),
      
      setNotificationSetting: (key, value) => set((state) => ({
        notifications: {
          ...state.notifications,
          [key]: value
        }
      })),
      
      updateAllSettings: (preferences) => set((state) => ({
        ...state,
        ...preferences,
        notifications: {
          ...state.notifications,
          ...(preferences.notifications || {})
        }
      })),
      
      resetSettings: () => set(defaultSettings)
    }),
    {
      name: 'harmonia-settings',
    }
  )
);
