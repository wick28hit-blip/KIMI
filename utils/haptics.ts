
const STORAGE_KEY = 'KIMI_HAPTICS';

export const isHapticsEnabled = () => {
  return localStorage.getItem(STORAGE_KEY) !== 'false'; // Default true
};

export const setHapticsEnabled = (enabled: boolean) => {
  localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
};

export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

export const triggerHaptic = (type: HapticType = 'light') => {
  // Check if feature is enabled in settings and supported by browser
  if (!isHapticsEnabled() || typeof navigator === 'undefined' || !navigator.vibrate) return;

  try {
      switch (type) {
        case 'light':
          navigator.vibrate(5); // Very crisp, subtle tick
          break;
        case 'medium':
          navigator.vibrate(15); // Standard button press
          break;
        case 'heavy':
          navigator.vibrate(30); // Prominent impact
          break;
        case 'success':
          navigator.vibrate([10, 30, 10]); // Quick double tap
          break;
        case 'warning':
          navigator.vibrate([30, 50, 10]);
          break;
        case 'error':
          navigator.vibrate([50, 100, 50, 100, 50]);
          break;
      }
  } catch (e) {
      // Ignore errors if vibration fails (e.g. user interaction requirements)
  }
};
