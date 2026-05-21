import type { RequestHandler } from "express";
import { AuthError } from "@/lib/errors";
import { parseAuthToken } from "@/services/auth.service";

export const requireAuth: RequestHandler = (req, res, next) => {
  const header = req.headers.authorization;
  const token =
    header?.startsWith("Bearer ") ? header.slice(7) : req.cookies?.token;

  if (!token) {
    res.status(401).json({ success: false, message: "Authentication required" });
    return;
  }

  try {
    req.user = parseAuthToken(token);
    next();
  } catch (error) {
    if (error instanceof AuthError) {
      res.status(error.status).json({ success: false, message: error.message });
      return;
    }
    next(error);
  }
};
