import jwt from 'jsonwebtoken';
import type { JWTPayload, User } from '@/types';
import { queryOne } from '@/services/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export async function authenticate(req: Request): Promise<User | null> {
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  
  if (!payload) {
    return null;
  }

  // Fetch user from database
  const user = await queryOne<User>(
    'SELECT * FROM users WHERE id = $1',
    [payload.userId]
  );

  return user;
}

export function requireAuth(handler: (req: Request, user: User, params?: Record<string, string>) => Promise<Response>) {
  return async (req: Request, params?: Record<string, string>): Promise<Response> => {
    const user = await authenticate(req);
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return handler(req, user, params);
  };
}
