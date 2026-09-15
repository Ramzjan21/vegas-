import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'vegas_cafe_jwt_secret_key_super_secure_2026';

export interface TokenPayload {
  id: number;
  username: string;
  role: string;
  fullName: string;
}

export const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
};
