import crypto from 'node:crypto';
import { promisify } from 'node:util';
const scrypt = promisify(crypto.scrypt);
export async function hashPassword(password: string): Promise<string> {
  if (typeof password !== 'string' || password.length < 12 || password.length > 128) throw new Error('A senha deve ter entre 12 e 128 caracteres.');
  const salt = crypto.randomBytes(16).toString('hex');
  const key = await scrypt(password, salt, 64) as Buffer;
  return `scrypt$${salt}$${key.toString('hex')}`;
}
export async function verifyPassword(password: unknown, hash?: string): Promise<boolean> {
  if (typeof password !== 'string' || password.length > 128 || !/^scrypt\$[a-f0-9]{32}\$[a-f0-9]{128}$/.test(hash || '')) return false;
  const [, salt, expected] = hash!.split('$');
  const actual = await scrypt(password, salt, 64) as Buffer;
  return crypto.timingSafeEqual(actual, Buffer.from(expected, 'hex'));
}
