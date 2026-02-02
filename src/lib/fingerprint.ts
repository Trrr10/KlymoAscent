// Device fingerprinting for anonymous identification
// This creates a unique device ID stored locally (no PII)

export const generateFingerprint = async (): Promise<string> => {
  const components: string[] = [];
  
  // Screen properties
  components.push(`${screen.width}x${screen.height}`);
  components.push(screen.colorDepth.toString());
  components.push(window.devicePixelRatio.toString());
  
  // Timezone
  components.push(Intl.DateTimeFormat().resolvedOptions().timeZone);
  
  // Language
  components.push(navigator.language);
  
  // Platform
  components.push(navigator.platform);
  
  // Hardware concurrency
  components.push(navigator.hardwareConcurrency?.toString() || '0');
  
  // Touch support
  components.push(navigator.maxTouchPoints?.toString() || '0');
  
  // WebGL renderer (more unique)
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl && gl instanceof WebGLRenderingContext) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        components.push(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL));
      }
    }
  } catch {
    components.push('no-webgl');
  }
  
  // Canvas fingerprint
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      canvas.width = 200;
      canvas.height = 50;
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('Ascent 🚀', 2, 15);
      components.push(canvas.toDataURL().slice(-50));
    }
  } catch {
    components.push('no-canvas');
  }
  
  // Add random component for first-time uniqueness
  const stored = localStorage.getItem('ascent_device_salt');
  const salt = stored || Math.random().toString(36).substring(2, 15);
  if (!stored) {
    localStorage.setItem('ascent_device_salt', salt);
  }
  components.push(salt);
  
  // Hash all components
  const fingerprint = components.join('|');
  const encoder = new TextEncoder();
  const data = encoder.encode(fingerprint);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
};

export const getStoredFingerprint = (): string | null => {
  return localStorage.getItem('ascent_fingerprint');
};

export const storeFingerprint = (fingerprint: string): void => {
  localStorage.setItem('ascent_fingerprint', fingerprint);
};

export const getStoredDeviceId = (): string | null => {
  return localStorage.getItem('ascent_device_id');
};

export const storeDeviceId = (deviceId: string): void => {
  localStorage.setItem('ascent_device_id', deviceId);
};

export const clearLocalData = (): void => {
  localStorage.removeItem('ascent_fingerprint');
  localStorage.removeItem('ascent_device_id');
  localStorage.removeItem('ascent_device_salt');
};
