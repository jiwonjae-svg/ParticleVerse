/**
 * Security utility functions
 * Defense mechanisms against various web attacks
 */

// HTML escape for XSS prevention
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;',
  };
  return text.replace(/[&<>"'`=/]/g, (s) => map[s]);
}

// Input sanitization (XSS, SQL Injection prevention)
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  
  // Remove HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');
  
  // Remove script-related keywords
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/on\w+=/gi, '');
  sanitized = sanitized.replace(/data:/gi, '');
  sanitized = sanitized.replace(/vbscript:/gi, '');
  
  // Remove SQL Injection patterns
  sanitized = sanitized.replace(/['";-]/g, '');
  sanitized = sanitized.replace(/\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|EXEC|EXECUTE)\b/gi, '');
  
  // Remove Command Injection patterns
  sanitized = sanitized.replace(/[|&;$`\\]/g, '');
  sanitized = sanitized.replace(/\.\./g, '');
  
  // Normalize whitespace
  sanitized = sanitized.replace(/\s+/g, ' ').trim();
  
  return sanitized;
}

// URL validation
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Only allowed protocols
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

// File extension validation
export function isAllowedFileType(filename: string, allowedExtensions: string[]): boolean {
  const ext = filename.toLowerCase().split('.').pop();
  return ext ? allowedExtensions.includes(`.${ext}`) : false;
}

// MIME type validation
export function isValidMimeType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type);
}

// File size validation
export function isFileSizeValid(file: File, maxSizeBytes: number): boolean {
  return file.size <= maxSizeBytes;
}

// File magic number validation (verify actual file type)
export async function validateFileMagicNumber(file: File): Promise<boolean> {
  const magicNumbers: Record<string, number[]> = {
    // Image
    'image/jpeg': [0xFF, 0xD8, 0xFF],
    'image/png': [0x89, 0x50, 0x4E, 0x47],
    'image/gif': [0x47, 0x49, 0x46],
    'image/webp': [0x52, 0x49, 0x46, 0x46],
    // 3D model
    'model/gltf-binary': [0x67, 0x6C, 0x54, 0x46], // glTF
  };

  const buffer = await file.slice(0, 8).arrayBuffer();
  const bytes = new Uint8Array(buffer);

  for (const [type, magic] of Object.entries(magicNumbers)) {
    if (file.type === type || file.name.toLowerCase().includes(type.split('/')[1])) {
      const matches = magic.every((byte, index) => bytes[index] === byte);
      if (matches) return true;
    }
  }

  // Special handling for GLB files
  if (file.name.toLowerCase().endsWith('.glb')) {
    // GLB magic: "glTF"
    return bytes[0] === 0x67 && bytes[1] === 0x6C && bytes[2] === 0x54 && bytes[3] === 0x46;
  }

  // GLTF (JSON) file
  if (file.name.toLowerCase().endsWith('.gltf')) {
    // JSON 파일은 텍스트로 시작
    return bytes[0] === 0x7B; // '{'
  }

  return false;
}

// Generate CSRF token
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

// Rate Limiting (client-side)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const record = requestCounts.get(key);

  if (!record || now > record.resetTime) {
    requestCounts.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}

// Input length limit
export function truncateInput(input: string, maxLength: number): string {
  if (input.length <= maxLength) return input;
  return input.substring(0, maxLength);
}

// Safe JSON parsing
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

// Object field filtering (Mass Assignment prevention)
export function filterFields<T extends Record<string, unknown>>(
  obj: T,
  allowedFields: (keyof T)[]
): Partial<T> {
  const filtered: Partial<T> = {};
  for (const field of allowedFields) {
    if (field in obj) {
      filtered[field] = obj[field];
    }
  }
  return filtered;
}

// UUID validation
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// Safe redirect URL validation (Open Redirect prevention)
export function isSafeRedirectUrl(url: string, allowedDomains: string[]): boolean {
  try {
    const parsed = new URL(url, window.location.origin);
    
    // Allow same origin
    if (parsed.origin === window.location.origin) {
      return true;
    }
    
    // Check allowed domains
    return allowedDomains.some(domain => parsed.hostname.endsWith(domain));
  } catch {
    return false;
  }
}

// Path Traversal prevention
export function sanitizePath(path: string): string {
  // Remove ..
  let sanitized = path.replace(/\.\./g, '');
  // Remove absolute path starting characters
  sanitized = sanitized.replace(/^[/\\]+/, '');
  // Remove special characters
  sanitized = sanitized.replace(/[<>:"|?*]/g, '');
  return sanitized;
}

// Content-Type 검증
export function isValidContentType(contentType: string, allowed: string[]): boolean {
  const type = contentType.split(';')[0].trim().toLowerCase();
  return allowed.includes(type);
}

// Async function wrapper with retry limit
export async function withRetryLimit<T>(
  fn: () => Promise<T>,
  maxRetries: number,
  delayMs: number
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs * (i + 1)));
      }
    }
  }
  
  throw lastError;
}

// Safe local storage access
export const safeStorage = {
  get(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  
  set(key: string, value: string): boolean {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  },
  
  remove(key: string): boolean {
    try {
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }
};

// Debounce (Race Condition 완화)
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

// Throttle
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
