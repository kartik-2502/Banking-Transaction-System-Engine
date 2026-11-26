export interface DeviceMetadata {
  deviceFingerprint: string;
  deviceName: string;
  browser: string;
  operatingSystem: string;
}

const STORAGE_KEY = 'bank_device_fp';

function getStableToken(): string {
  try {
    let token = localStorage.getItem(STORAGE_KEY);
    if (!token) {
      const randomBytes = new Uint8Array(16);
      if (window.crypto && window.crypto.getRandomValues) {
        window.crypto.getRandomValues(randomBytes);
      } else {
        for (let i = 0; i < randomBytes.length; i++) {
          randomBytes[i] = Math.floor(Math.random() * 256);
        }
      }
      token = Array.from(randomBytes, (b) => b.toString(16).padStart(2, '0')).join('');
      localStorage.setItem(STORAGE_KEY, token);
    }
    return token;
  } catch {
    return 'web-session-device';
  }
}

function detectBrowser(ua: string): string {
  if (/Edg\//i.test(ua)) return 'Microsoft Edge';
  if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) return 'Google Chrome';
  if (/Firefox\//i.test(ua)) return 'Mozilla Firefox';
  if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) return 'Apple Safari';
  return 'Web Browser';
}

function detectOs(ua: string): string {
  if (/Windows NT/i.test(ua)) return 'Windows';
  if (/Mac OS X/i.test(ua)) return 'macOS';
  if (/Android/i.test(ua)) return 'Android';
  if (/iPhone|iPad/i.test(ua)) return 'iOS';
  if (/Linux/i.test(ua)) return 'Linux';
  return 'Desktop OS';
}

export function getDeviceMetadata(): DeviceMetadata {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : 'Browser';
  const browser = detectBrowser(ua);
  const operatingSystem = detectOs(ua);
  const screenSig =
    typeof window !== 'undefined' && window.screen
      ? `${window.screen.width}x${window.screen.height}`
      : '1920x1080';
  const tz =
    typeof Intl !== 'undefined'
      ? Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
      : 'UTC';

  const deviceFingerprint = `${getStableToken()}:${operatingSystem}:${screenSig}:${tz}`;
  return {
    deviceFingerprint,
    deviceName: `${browser} on ${operatingSystem}`,
    browser,
    operatingSystem,
  };
}
