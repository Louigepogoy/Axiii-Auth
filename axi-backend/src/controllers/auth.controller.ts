import type { RequestHandler } from "express";
import { env } from "@/config/env";
import {
  getUserByEmail,
  getUserById,
  listRegisteredUsers,
  loginUser,
  registerUser,
} from "@/services/auth.service";
import { asyncHandler } from "@/utils/asyncHandler";
import type { LoginInput, RegisterInput } from "@/validators/auth.schema";

const isProduction = env.NODE_ENV === "production";

function setAuthCookie(res: Parameters<RequestHandler>[1], token: string) {
  res.cookie("token", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function authResponse(
  res: Parameters<RequestHandler>[1],
  status: number,
  message: string,
  user: { id: string; email: string; name: string | null; createdAt: Date },
  token: string
) {
  setAuthCookie(res, token);
  res.status(status).json({
    success: true,
    message,
    data: { user, token },
  });
}

export const register = asyncHandler(async (req, res) => {
  const body = req.body as RegisterInput;
  const { user, token } = await registerUser(body);
  authResponse(res, 201, "Registration successful", user, token);
});

export const login = asyncHandler(async (req, res) => {
  const body = req.body as LoginInput;
  const { user, token } = await loginUser(body);
  authResponse(res, 200, "Login successful", user, token);
});

export const me = asyncHandler(async (req, res) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Authentication required" });
    return;
  }
  const user = await getUserById(req.user.userId);
  res.json({ success: true, data: { user } });
});

export const logout: RequestHandler = (_req, res) => {
  res.clearCookie("token");
  res.json({ success: true, message: "Logged out successfully" });
};

/** GET /registered or /registered?email=... — no token needed */
export const showRegistered = asyncHandler(async (req, res) => {
  const email = typeof req.query.email === "string" ? req.query.email : undefined;

  if (email) {
    const user = await getUserByEmail(email);
    res.json({ success: true, data: { user } });
    return;
  }

  const users = await listRegisteredUsers();
  res.json({ success: true, data: { users } });
});
