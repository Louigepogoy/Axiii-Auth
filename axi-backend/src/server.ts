import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { env } from "@/config/env";
import { errorHandler } from "@/middleware/errorHandler";
import { prisma } from "@/lib/prisma";
import { authRouter } from "@/routes/auth.routes";
import { registeredRouter } from "@/routes/registered.routes";

const app = express();

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.json({ success: true, status: "ok" });
});

app.use("/api/auth", authRouter);

// Simple Postman URLs (no token for GET)
app.use("/registered", registeredRouter);
app.use("/registed", registeredRouter);

app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use(errorHandler);

async function start() {
  try {
    await prisma.$connect();
    await prisma.user.count();
    console.log("Database connected and User table is ready");
  } catch (error) {
    console.error("\n--- Database setup failed ---\n");
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("Authentication failed") || message.includes("P1000")) {
      console.error(
        "Your DATABASE_URL in .env has invalid credentials.\n" +
          "1. Go to https://console.neon.tech\n" +
          "2. Open your project → Connection details → copy PostgreSQL URL\n" +
          "3. Paste it into axi-backend/.env as DATABASE_URL\n" +
          "4. Run: npm run db:push\n" +
          "5. Run: npm run dev\n"
      );
    } else if (message.includes("does not exist")) {
      console.error(
        'Database URL works but tables are missing. Run: npm run db:push\n'
      );
    } else if (message.includes("endpoint could not be found")) {
      console.error(
        "Neon project/database was deleted or URL is wrong. Create a new DB on neon.tech and update .env\n"
      );
    } else {
      console.error(
        "Update DATABASE_URL in .env with your Neon connection string, then run npm run db:push\n"
      );
    }
    console.error(message);
    process.exit(1);
  }

  const server = app.listen(env.PORT, () => {
    console.log(`${env.APP_NAME} running on http://localhost:${env.PORT}`);
    console.log("Auth routes:");
    console.log(`  POST http://localhost:${env.PORT}/api/auth/register`);
    console.log(`  POST http://localhost:${env.PORT}/api/auth/login`);
    console.log(`  GET  http://localhost:${env.PORT}/api/auth/me`);
    console.log(`  POST http://localhost:${env.PORT}/api/auth/logout`);
    console.log("Simple display routes (Postman):");
    console.log(`  GET  http://localhost:${env.PORT}/registered`);
    console.log(`  GET  http://localhost:${env.PORT}/registered?email=you@example.com`);
    console.log(`  POST http://localhost:${env.PORT}/registered`);
    console.log(`  (same as /registed)`);
    console.log("\nServer is running. Press Ctrl+C to stop.\n");
  });

  server.on("error", (error: NodeJS.ErrnoException) => {
    if (error.code === "EADDRINUSE") {
      console.error(
        `\nPort ${env.PORT} is already in use. Either:\n` +
          `  - Stop the other server (close the other terminal), or\n` +
          `  - Change PORT=8001 in your .env file and run npm run dev again\n`
      );
    } else {
      console.error(error);
    }
    process.exit(1);
  });
}

start();
