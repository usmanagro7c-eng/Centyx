import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import { config } from "./config/erpnext.config.js";
import apiRouter from "./routes/index.js";
import { errorHandler } from "./middlewares/error.middleware.js";

const app = express();

// Trust the first proxy hop (needed for rate limiting behind a reverse proxy).
app.set("trust proxy", 1);

// Security headers.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// CORS: exact origin allowlist, credentials enabled.
const allowedOrigins = new Set(
  [config.frontendUrl, "http://localhost:3000", "http://localhost:5173", "http://localhost:8080", "http://localhost:8081"].filter(
    (origin) => /^https?:\/\/[^/]+$/.test(origin)
  )
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Origin not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "X-CSRF-Token"],
  })
);

// Global rate limit.
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// Login-specific rate limit.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Try again later." },
});
app.use("/api/method/login", loginLimiter);

// Body parsers with explicit size limits.
app.use(morgan("combined"));
app.use(express.json({ limit: "256kb" }));
app.use(express.urlencoded({ extended: true, limit: "256kb" }));

// Healthcheck — no internal target disclosure.
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "Aether ERPNext Middleware Backend",
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/api", apiRouter);

// Error Handling Middleware
app.use(errorHandler);

// Start Server
app.listen(config.port, () => {
  console.log(`Aether Backend Middleware running on http://localhost:${config.port}`);
});
