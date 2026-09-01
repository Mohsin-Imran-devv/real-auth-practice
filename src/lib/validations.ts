import { z } from "zod";

export const signupSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),

    image: z
      .custom<FileList>()
      .refine((files) => files?.length > 0, "Profile image is required")
      .refine(
        (files) =>
          ["image/jpeg", "image/png", "image/webp"].includes(files?.[0]?.type),
        "Only JPG, PNG, and WebP images are allowed",
      )
      .refine(
        (files) => files?.[0]?.size <= 5 * 1024 * 1024,
        "Image must be less than 5MB",
      )
      .transform((files) => files[0]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password do not match",
    path: ["confirmPassword"],
  });

export const signupServerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password do not match",
    path: ["confirmPassword"],
  });
