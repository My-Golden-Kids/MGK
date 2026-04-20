import type { CapacitorConfig } from '@capacitor/cli';

const serverUrl =
  process.env.CAPACITOR_SERVER_URL ?? 'http://localhost:3000/health/walk';

const config: CapacitorConfig = {
  appId: 'com.mygoldenkids.app',
  appName: 'MGK',
  webDir: 'capacitor-web',
  server: {
    url: serverUrl,
    cleartext: serverUrl.startsWith('http://'),
  },
};

export default config;
