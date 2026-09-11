import { z } from "zod";

export const roles = ["super_admin", "au_admin", "np_admin", "content_editor"] as const;

export const createUserSchema = z.object({
  name: z.string().trim().min(1, "Give the person a name."),
  email: z.email("That is not an email address.").toLowerCase(),
  password: z.string().min(12, "Use at least 12 characters."),
  role: z.enum(roles),
  officeId: z.uuid().nullable().default(null),
  confirmation: z.string().optional(),
});

export const updateUserSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1, "Give the person a name."),
  role: z.enum(roles),
  officeId: z.uuid().nullable().default(null),
  isActive: z.boolean(),
  confirmation: z.string().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
