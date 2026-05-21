import { prisma } from "@/lib/prisma";
import { AuthError, mapPrismaError } from "@/lib/errors";
import { signToken, verifyToken } from "@/lib/jwt";
import { hashPassword, verifyPassword } from "@/lib/password";
import type { LoginInput, RegisterInput } from "@/validators/auth.schema";

export type PublicUser = {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
};

function toPublicUser(user: PublicUser): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
  };
}

async function withDb<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    const mapped = mapPrismaError(error);
    if (mapped) throw mapped;
    throw error;
  }
}

export async function registerUser(input: RegisterInput) {
  return withDb(async () => {
    const email = input.email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AuthError("Email is already registered", 409);
    }

    const passwordHash = await hashPassword(input.password);

    const user = await prisma.user.create({
      data: {
        email,
        password: passwordHash,
        name: input.name?.trim(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    const token = signToken({ userId: user.id, email: user.email });
    return { user: toPublicUser(user), token };
  });
}

export async function loginUser(input: LoginInput) {
  return withDb(async () => {
    const email = input.email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AuthError("Invalid email or password", 401);
    }

    const valid = await verifyPassword(input.password, user.password);
    if (!valid) {
      throw new AuthError("Invalid email or password", 401);
    }

    const token = signToken({ userId: user.id, email: user.email });
    return { user: toPublicUser(user), token };
  });
}

export async function getUserById(userId: string) {
  return withDb(async () => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AuthError("User not found", 404);
    }

    return toPublicUser(user);
  });
}

export function parseAuthToken(token: string) {
  try {
    return verifyToken(token);
  } catch {
    throw new AuthError("Invalid or expired token", 401);
  }
}

export async function listRegisteredUsers() {
  return withDb(async () => {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return users.map(toPublicUser);
  });
}

export async function getUserByEmail(email: string) {
  return withDb(async () => {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AuthError("User not found", 404);
    }

    return toPublicUser(user);
  });
}
