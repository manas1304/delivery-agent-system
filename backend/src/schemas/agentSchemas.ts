import { z } from "zod";

export const agentSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address format"),
  phoneNumber: z.string().regex(/^[0-9]{10,15}$/, "Phone number must be 10-15 digits"),
  serviceArea: z.string().min(1, "Service area is required"),
  status: z.enum(["active", "inactive"]).optional(),
});