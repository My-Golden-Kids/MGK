export const ALARM_ENABLED_STORAGE_KEY = 'settings-alarm-enabled';

const DEFAULT_ALARM_ENABLED = true;

export function getStoredAlarmEnabled() {
  if (typeof window === 'undefined') {
    return DEFAULT_ALARM_ENABLED;
  }

  const storedValue = window.localStorage.getItem(ALARM_ENABLED_STORAGE_KEY);

  if (storedValue === null) {
    return DEFAULT_ALARM_ENABLED;
  }

  return storedValue === 'true';
}

export function storeAlarmEnabled(enabled: boolean) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(ALARM_ENABLED_STORAGE_KEY, String(enabled));
}
