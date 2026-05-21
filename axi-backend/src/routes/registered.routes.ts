import { Router } from "express";
import { register, showRegistered } from "@/controllers/auth.controller";
import { validateBody } from "@/middleware/validate";
import { registerSchema } from "@/validators/auth.schema";

const registeredRouter = Router();

// Simple URLs for Postman (no Bearer token needed for GET)
registeredRouter.get("/", showRegistered);
registeredRouter.post("/", validateBody(registerSchema), register);

export { registeredRouter };
