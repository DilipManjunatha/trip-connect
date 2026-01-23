import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export const generateToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not defined in the environment variables.");
  }
  // Use type assertion to work around jsonwebtoken type strictness
  return jwt.sign({ userId }, secret, { 
    expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any 
  });
};

export const verifyToken = (token: string): { userId: string } => {
  return jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
};

export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, 12);
};

export const comparePassword = async (
  password: string, 
  hashedPassword: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};