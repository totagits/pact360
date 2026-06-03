import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';

const ACCESS_SECRET = process.env.JWT_SECRET || 'super_secret_pact360_access_token_key_12345';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'super_secret_pact360_refresh_token_key_54321';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  permissions: string[];
}

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: '15m' });
}

export function generateRefreshToken(payload: { userId: string }): string {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' });
}

export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, ACCESS_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
}

export function verifyRefreshToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, REFRESH_SECRET) as { userId: string };
  } catch (error) {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
