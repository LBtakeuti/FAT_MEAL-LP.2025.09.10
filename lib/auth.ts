import { NextRequest, NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// ハードコードされた管理者認証情報（本番環境では環境変数を使用）
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
// パスワード: admin123 のハッシュ値
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '$2b$10$SZmfJkOUTYKq..1dqWHtDOpe6HaV1ycuwsccq.KB1OhTu1bm4IlVS';

export interface AdminUser {
  username: string;
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.compare(password, hashedPassword);
}

export async function generateToken(user: AdminUser): Promise<string> {
  const jwt = await import('jsonwebtoken');
  return jwt.sign(user, JWT_SECRET, { expiresIn: '24h' });
}

export async function verifyToken(token: string): Promise<AdminUser | null> {
  try {
    const jwt = await import('jsonwebtoken');
    return jwt.verify(token, JWT_SECRET) as AdminUser;
  } catch {
    return null;
  }
}

export async function authenticateUser(username: string, password: string): Promise<AdminUser | null> {
  if (username === ADMIN_USERNAME) {
    const isValid = await verifyPassword(password, ADMIN_PASSWORD_HASH);
    if (isValid) {
      return { username };
    }
  }
  return null;
}

export function getAuthToken(req: NextRequest): string | undefined {
  return req.cookies.get('auth-token')?.value;
}

export function setAuthCookie(res: NextResponse, token: string): void {
  res.cookies.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/'
  });
}

export function clearAuthCookie(res: NextResponse): void {
  res.cookies.delete('auth-token');
}