import { Injectable } from '@angular/core';

/**
 * Simple encryption/decryption service for URL parameters.
 * Encodes sensitive IDs using base64 with a simple XOR cipher for obfuscation.
 * Note: This adds security through obscurity; for highly sensitive data, consider
 * using a backend-generated token system instead.
 */
@Injectable({ providedIn: 'root' })
export class EncryptionService {

  private readonly SECRET_KEY = 'efforttracker_secret_2025';

  /**
   * Encrypt a number (typically an ID) into a URL-safe string
   */
  encrypt(value: number): string {
    const str = value.toString();
    const encrypted = this.simpleEncrypt(str);
    return btoa(encrypted).replace(/[+/=]/g, (m: string) => {
      const replacements: Record<string, string> = { '+': '-', '/': '_', '=': '~' };
      return replacements[m] || m;
    });
  }

  /**
   * Decrypt a URL-safe string back to the original number
   */
  decrypt(encrypted: string): number | null {
    try {
      const urlSafeDecoded = encrypted
        .replace(/-/g, '+')
        .replace(/_/g, '/')
        .replace(/~/g, '=');
      const decoded = atob(urlSafeDecoded);
      const decrypted = this.simpleDecrypt(decoded);
      return parseInt(decrypted, 10);
    } catch (e) {
      console.error('Decryption failed:', e);
      return null;
    }
  }

  /**
   * Simple encryption using XOR with secret key
   */
  private simpleEncrypt(text: string): string {
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(
        text.charCodeAt(i) ^ this.SECRET_KEY.charCodeAt(i % this.SECRET_KEY.length)
      );
    }
    return result;
  }

  /**
   * Simple decryption using XOR with secret key
   */
  private simpleDecrypt(text: string): string {
    return this.simpleEncrypt(text); // XOR is symmetric
  }
}
