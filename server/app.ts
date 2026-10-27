import "dotenv/config";
import express, { type Express } from "express";
import path from "node:path";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./_core/oauth";
import { registerLabRoutes } from "./lab-api";
import { publicPlatformScript } from "./_core/publicConfig";
import { appRouter } from "./routers";
import { createContext } from "./_core/context";

export function createExpressApp(): Express {
  const app = express();

  // Configure body parser
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Health check
  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

  // Platform config script
  app.get("/api/platform/config.js", (_req, res) => {
    res.set("Cache-Control", "no-store").type("application/javascript").send(publicPlatformScript());
  });

  // Storage / logo fallback
  app.get("/manus-storage/*", (_req, res) => {
    res.type("image/svg+xml").sendFile(path.resolve(process.cwd(), "client/public/lab-mark.svg"));
  });

  // Authentication & Lab APIs
  registerOAuthRoutes(app);
  registerLabRoutes(app);

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  return app;
}

export const app = createExpressApp();
export default app;
