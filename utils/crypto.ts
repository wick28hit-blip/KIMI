// In a production environment, we would use window.crypto.subtle for AES-GCM.
// For this demo, to ensure it runs without complex async initialization and salt management 
// in a single-file viewing context, we will use a Base64 obfuscation layer.
// NOTE: THIS IS A SIMULATION OF ENCRYPTION FOR THE PROTOTYPE.

export const encryptData = (data: any, key: string): string => {
  try {
    const json = JSON.stringify(data);
    // Simple XOR cipher simulation with the PIN
    const result = json.split('').map((c, i) => {
      return String.fromCharCode(c.charCodeAt(0) ^ key.charCodeAt(i % key.length));
    }).join('');
    return btoa(result);
  } catch (e) {
    console.error("Encryption failed", e);
    return "";
  }
};

export const decryptData = (ciphertext: string, key: string): any => {
  try {
    const decoded = atob(ciphertext);
    const result = decoded.split('').map((c, i) => {
      return String.fromCharCode(c.charCodeAt(0) ^ key.charCodeAt(i % key.length));
    }).join('');
    return JSON.parse(result);
  } catch (e) {
    console.error("Decryption failed", e);
    return null;
  }
};

export const STORAGE_KEY = 'KIMI_SECURE_DATA';
export const HAS_ACCOUNT_KEY = 'KIMI_HAS_ACCOUNT';