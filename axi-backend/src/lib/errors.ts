import { Prisma } from "@/generated/prisma/client";

export class AppError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AppError";
    this.status = status;
  }
}

export class AuthError extends AppError {
  constructor(message: string, status: number) {
    super(message, status);
    this.name = "AuthError";
  }
}

export function mapPrismaError(error: unknown): AppError | null {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      const field = (error.meta?.target as string[] | undefined)?.[0] ?? "field";
      return new AuthError(`${field} already exists`, 409);
    }
    if (error.code === "P2025") {
      return new AuthError("Record not found", 404);
    }
    if (error.code === "P2021") {
      return new AppError(
        'Database tables missing. Run "npm run db:push" in the axi-backend folder.',
        503
      );
    }
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return new AppError(
      "Database connection failed. Check DATABASE_URL in your .env file.",
      503
    );
  }

  const message = error instanceof Error ? error.message : "";
  if (message.includes("Authentication failed") || message.includes("P1000")) {
    return new AppError(
      "Invalid DATABASE_URL — wrong password or expired Neon credentials. Copy a fresh connection string from neon.tech into .env",
      503
    );
  }
  if (message.includes("endpoint could not be found")) {
    return new AppError(
      "Neon database not found — project may be deleted. Create a new database on neon.tech and update DATABASE_URL in .env",
      503
    );
  }
  if (message.includes("does not exist") && message.includes("User")) {
    return new AppError(
      'Auth tables missing. Run "npm run db:push" after fixing DATABASE_URL.',
      503
    );
  }

  return null;
}
