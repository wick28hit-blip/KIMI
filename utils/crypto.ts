// Simple XOR Cipher + Base64 simulation for React Native Demo
// In production, use Expo SecureStore.

const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

// Custom btoa implementation for React Native if global is missing
const btoaPolyfill = (input: string) => {
  let str = input;
  let output = '';

  for (let block = 0, charCode, i = 0, map = chars;
  str.charAt(i | 0) || (map = '=', i % 1);
  output += map.charAt(63 & block >> 8 - i % 1 * 8)) {
    charCode = str.charCodeAt(i += 3 / 4);
    if (charCode > 0xFF) {
      throw new Error("'btoa' failed: The string to be encoded contains characters outside of the Latin1 range.");
    }
    block = block << 8 | charCode;
  }
  return output;
};

// Custom atob implementation
const atobPolyfill = (input: string) => {
  let str = input.replace(/=+$/, '');
  let output = '';

  if (str.length % 4 == 1) {
    throw new Error("'atob' failed: The string to be decoded is not correctly encoded.");
  }
  for (let bc = 0, bs = 0, buffer, i = 0;
    buffer = str.charAt(i++);
    ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer,
      bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0
  ) {
    buffer = chars.indexOf(buffer);
  }
  return output;
};

const safeBtoa = (str: string) => {
    if (typeof btoa !== 'undefined') return btoa(str);
    return btoaPolyfill(str);
};

const safeAtob = (str: string) => {
    if (typeof atob !== 'undefined') return atob(str);
    return atobPolyfill(str);
};

export const encryptData = (data: any, key: string): string => {
  try {
    const json = JSON.stringify(data);
    const result = json.split('').map((c, i) => {
      return String.fromCharCode(c.charCodeAt(0) ^ key.charCodeAt(i % key.length));
    }).join('');
    return safeBtoa(result);
  } catch (e) {
    return "";
  }
};

export const decryptData = (ciphertext: string, key: string): any => {
  try {
    const decoded = safeAtob(ciphertext);
    const result = decoded.split('').map((c, i) => {
      return String.fromCharCode(c.charCodeAt(0) ^ key.charCodeAt(i % key.length));
    }).join('');
    return JSON.parse(result);
  } catch (e) {
    return null;
  }
};

export const STORAGE_KEY = 'KIMI_SECURE_DATA';
export const HAS_ACCOUNT_KEY = 'KIMI_HAS_ACCOUNT';
