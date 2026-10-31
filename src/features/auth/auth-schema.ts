import { z } from "zod";

export const registerSchema = z.object({ email: z.string(), password: z.string() });
export const signInSchema = z.object({ email: z.string(), password: z.string() });

export type Credentials = z.infer<typeof registerSchema>;

export function fieldErrors(error: z.ZodError): Record<string, string> {
  void error;
  throw new Error("Not implemented: fieldErrors");
}
