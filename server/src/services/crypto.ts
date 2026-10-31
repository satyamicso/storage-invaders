import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits recommended for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits

export interface SessionData {
  accessToken: string;
  expiryDate?: number;
  email?: string;
  name?: string;
  picture?: string;
}

export class CryptoService {
  private key: Buffer;

  constructor(secretKey?: string) {
    const rawSecret = secretKey || process.env.SESSION_SECRET || 'default-fallback-insecure-secret-min-32-chars-long!';
    // Derive a fixed 32-byte (256-bit) key using SHA-256
    this.key = crypto.createHash('sha256').update(rawSecret).digest();
  }

  /**
   * Encrypts an object into a base64 string with AES-256-GCM authenticated tag.
   * Format: base64(iv):base64(authTag):base64(ciphertext)
   */
  public encrypt(data: SessionData): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, this.key, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });

    const plaintext = JSON.stringify(data);
    let ciphertext = cipher.update(plaintext, 'utf8', 'base64');
    ciphertext += cipher.final('base64');
    const authTag = cipher.getAuthTag();

    return `${iv.toString('base64')}:${authTag.toString('base64')}:${ciphertext}`;
  }

  /**
   * Decrypts and verifies authentication tag.
   * Throws Error if corrupted or tampered.
   */
  public decrypt(token: string): SessionData {
    const parts = token.split(':');
    if (parts.length !== 3) {
      throw new Error('Malformed encrypted token format');
    }

    const [ivB64, authTagB64, ciphertextB64] = parts;
    const iv = Buffer.from(ivB64, 'base64');
    const authTag = Buffer.from(authTagB64, 'base64');

    if (iv.length !== IV_LENGTH || authTag.length !== AUTH_TAG_LENGTH) {
      throw new Error('Invalid IV or auth tag length in session cookie');
    }

    const decipher = crypto.createDecipheriv(ALGORITHM, this.key, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertextB64, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted) as SessionData;
  }
}

export const cryptoService = new CryptoService();
