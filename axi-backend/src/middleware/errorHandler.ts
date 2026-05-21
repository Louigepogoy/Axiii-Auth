import type { ErrorRequestHandler } from "express";
import { AppError, mapPrismaError } from "@/lib/errors";

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  const mapped = mapPrismaError(error);

  if (mapped) {
    res.status(mapped.status).json({ success: false, message: mapped.message });
    return;
  }

  if (error instanceof AppError) {
    res.status(error.status).json({ success: false, message: error.message });
    return;
  }

  if (error instanceof Error && error.message.includes("JWT_SECRET")) {
    res.status(500).json({
      success: false,
      message: "JWT_SECRET is not configured in .env",
    });
    return;
  }

  console.error(error);

  const devHint =
    process.env.NODE_ENV === "development" && error instanceof Error
      ? error.message
      : undefined;

  res.status(500).json({
    success: false,
    message: devHint ?? "Internal server error",
  });
};
