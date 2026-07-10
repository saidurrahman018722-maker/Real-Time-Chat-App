import z from 'zod';



export const loginSchema = z.object({
  email: z.string("Email must be a string").email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters").max(20, "Password must be at most 20 characters"),
});

export const registrationSchema = z.object({
  name: z.string("Name must be a string").min(3, "Name must be at least 3 characters").max(50, "Name must be at most 50 characters"),
  email: z.string("Email must be a string").email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters").max(20, "Password must be at most 20 characters"),
});

export const optSchema = z.object({
  otp: z.string().min(6).max(6),
});