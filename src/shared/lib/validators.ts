import { z } from 'zod';

export const registerSchema = z.object({
  clientId: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8).max(128),
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
  password: z.string().min(8).max(128),
});

export const tenantLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const createAppSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(300).optional(),
  allowedOrigins: z.array(z.string().url()).min(1),
});
