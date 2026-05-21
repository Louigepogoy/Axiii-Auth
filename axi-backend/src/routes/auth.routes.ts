import { Router } from "express";
import { login, logout, me, register } from "@/controllers/auth.controller";
import { requireAuth } from "@/middleware/auth";
import { validateBody } from "@/middleware/validate";
import { loginSchema, registerSchema } from "@/validators/auth.schema";

const authRouter = Router();

authRouter.post("/register", validateBody(registerSchema), register);
authRouter.post("/login", validateBody(loginSchema), login);
authRouter.post("/logout", logout);
authRouter.get("/me", requireAuth, me);

export { authRouter };
