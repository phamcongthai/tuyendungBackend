import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'donthackmepls!';
const DEFAULT_EXPIRES = '1h';

export const signJwt = (payload: Record<string, any>, expiresIn = DEFAULT_EXPIRES): string =>
  jwt.sign(payload, JWT_SECRET, { expiresIn });

export const verifyJwt = <T = any>(token: string): T =>
  jwt.verify(token, JWT_SECRET) as T;
