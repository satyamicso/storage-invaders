import { describe, it, expect } from 'vitest';
import { CryptoService, type SessionData } from './crypto.js';

describe('CryptoService (AES-256-GCM Session Encryption)', () => {
  const service = new CryptoService('my-super-secret-production-key-at-least-32-chars!');

  it('performs seamless round-trip encryption and authenticated decryption', () => {
    const session: SessionData = {
      accessToken: 'ya29.a0AfH6SMD_mock_google_oauth_access_token_12345',
      expiryDate: Date.now() + 3600000,
      email: 'player@example.com',
      name: 'Arcade Player',
    };

    const encrypted = service.encrypt(session);
    expect(typeof encrypted).toBe('string');
    expect(encrypted.split(':').length).toBe(3);

    const decrypted = service.decrypt(encrypted);
    expect(decrypted.accessToken).toBe(session.accessToken);
    expect(decrypted.email).toBe(session.email);
    expect(decrypted.name).toBe(session.name);
  });

  it('detects and rejects ciphertext tampering', () => {
    const session: SessionData = {
      accessToken: 'secret-token-xyz',
    };

    const encrypted = service.encrypt(session);
    const [iv, tag, ciphertext] = encrypted.split(':');

    // Invert first byte of ciphertext Buffer to guarantee cryptographic modification
    const buf = Buffer.from(ciphertext, 'base64');
    buf[0] ^= 0xff;
    const tamperedEncrypted = `${iv}:${tag}:${buf.toString('base64')}`;

    expect(() => service.decrypt(tamperedEncrypted)).toThrow();
  });

  it('detects and rejects authentication tag tampering', () => {
    const session: SessionData = {
      accessToken: 'secret-token-xyz',
    };

    const encrypted = service.encrypt(session);
    const [iv, tag, ciphertext] = encrypted.split(':');

    // Invert first byte of authentication tag
    const tagBuf = Buffer.from(tag, 'base64');
    tagBuf[0] ^= 0xff;
    const tamperedEncrypted = `${iv}:${tagBuf.toString('base64')}:${ciphertext}`;

    expect(() => service.decrypt(tamperedEncrypted)).toThrow();
  });

  it('generates unique IVs on every encryption call for semantic security', () => {
    const session: SessionData = { accessToken: 'token-abc' };
    const enc1 = service.encrypt(session);
    const enc2 = service.encrypt(session);

    expect(enc1).not.toBe(enc2);
    expect(service.decrypt(enc1)).toEqual(service.decrypt(enc2));
  });
});
