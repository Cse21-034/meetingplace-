/**
 * Main Express.js Server for Kgotla Discussion Forum
 * 
 * This is the entry point for the full-stack application that serves both
 * the API backend and the React frontend. It handles:
 * - Firebase authentication integration
 * - API route registration and middleware setup
 * - Request/response logging for debugging
 * - Error handling and status codes
 * - Development vs production environment configuration
 * - Static file serving and Vite integration
 */

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

// Initialize Express application
const app = express();

// Middleware for parsing JSON and URL-encoded request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

/**
 * Request Logging Middleware
 * 
 * Captures API request details for debugging and monitoring:
 * - Request method, path, and response status
 * - Response time calculation
 * - JSON response body for API routes
 * - Truncates long log lines to prevent output overflow
 */
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  // Intercept res.json to capture response body
  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  // Log when response is finished
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      // Truncate long log lines
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

/**
 * Main Application Setup and Server Start
 * 
 * Initializes the complete application stack:
 * 1. Registers API routes with authentication
 * 2. Sets up error handling middleware
 * 3. Configures development/production environments
 * 4. Starts the HTTP server on port 5000
 */
(async () => {
  // Register all API routes, authentication, and WebSocket setup
  const server = await registerRoutes(app);

  /**
   * Global Error Handler
   * 
   * Catches all uncaught errors and formats them as JSON responses.
   * Extracts status code from error object or defaults to 500.
   */
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  /**
   * Environment-Specific Frontend Setup
   * 
   * Development: Uses Vite dev server with hot module replacement
   * Production: Serves static files from dist directory
   * 
   * IMPORTANT: This must be set up AFTER API routes to prevent
   * the catch-all route from interfering with API endpoints
   */
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  /**
   * Server Configuration
   * 
   * Port 5000: Required for Replit environment (not firewalled)
   * Host 0.0.0.0: Allows external connections
   * reusePort: Enables multiple processes to bind to same port
   */
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
