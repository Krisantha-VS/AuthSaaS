import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128)
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const registerSchema = z.object({
  clientId: z.string().min(1),
  email: z.string().email(),
  password: passwordSchema,
  name: z.string().max(100).optional(),
});

export const loginSchema = z.object({
  clientId: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(1),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const tenantRegisterSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: passwordSchema,
});

export const tenantLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  clientId: z.string().min(1),
  email: z.string().email(),
  redirectTo: z.string().optional(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  email: z.string().email(),
  password: passwordSchema,
});

export const createAppSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(300).optional(),
  allowedOrigins: z.array(z.string().url()).min(1),
});
