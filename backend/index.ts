import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./swagger";
import { registerRoutes } from "./routes";
import { registerAdminRoutes } from "./adminRoutes";

export const app = express();

// -------------------- Swagger --------------------
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// -------------------- Session --------------------
app.use(
  session({
    secret:
      process.env.SESSION_SECRET ||
      "vt-annotator-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24h
    },
  })
);

// -------------------- Body parsers --------------------
app.use(
  express.json({
    verify: (req, _res, buf) => {
      (req as any).rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: false }));

// -------------------- Logger middleware --------------------
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", async () => {
    if (!path.startsWith("/api")) return;

    const duration = Date.now() - start;
    let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;

    if (capturedJsonResponse) {
      logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
    }

    if (logLine.length > 80) {
      logLine = logLine.slice(0, 79) + "…";
    }

    // ne loguj tokom testova
    if (process.env.NODE_ENV !== "test") {
      const { log } = await import("./vite");
      log(logLine);
    }
  });

  next();
});

// ==================== BOOTSTRAP / READY ====================
export const ready = (async () => {
  const server = await registerRoutes(app);
  registerAdminRoutes(app);

  // -------------------- Global error handler --------------------
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    if (process.env.NODE_ENV !== "test") {
      console.error("Global error handler:", err);
    }

    res.status(status).json({
      success: false,
      error: message,
      code: err.code || "INTERNAL_ERROR",
    });
  });

  // -------------------- Vite / Static --------------------
  if (process.env.NODE_ENV !== "test") {
    const { setupVite, serveStatic, log } = await import("./vite");

    if (process.env.NODE_ENV === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    const port = parseInt(process.env.PORT || "5006", 10);
    server.listen(port, () => {
      log(`serving on port ${port}`);
    });
  }
})();
