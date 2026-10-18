import { ZodType, ZodError } from "zod"
import { Request, Response, NextFunction } from "express";

export const validate = (schema: ZodType) => (req: Request, res: Response, next: NextFunction) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error: any) {
    // Send back the first specific validation error message
    if (error instanceof ZodError) { res.status(400).json({ error: (error as any).issues[0].message }); } else { res.status(400).json({ error: "Validation failed" }); }
  }
};