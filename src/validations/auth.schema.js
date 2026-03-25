import { z } from 'zod';

const usernameSchema = z.string()
  .trim()
  .min(1, "username is required")
  .min(3, "Username must be at least 3 characters");

const emailSchema = z.string()
  .trim()
  .min(1, "email is required")
  .email("Invalid email format");

const passwordSchema = z.string()
  .trim()
  .min(1, "password is required")
  .min(8, "Password must be at least 8 characters");

const tokenSchema = z.string()
  .min(1, "Token is required");

export const registerSchema = z.object({
  body: z.object({
    username: usernameSchema,
    email: emailSchema,
    password: passwordSchema
  })
});

export const loginSchema = z.object({
  body: z.object({
    username: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password is required")
  })
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: emailSchema
  })
});

export const verifyResetTokenSchema = z.object({
  body: z.object({
    email: emailSchema,
    token: tokenSchema
  })
});

export const resetPasswordSchema = z.object({
  body: z.object({
    email: emailSchema,
    token: tokenSchema,
    password: passwordSchema
  })
});
