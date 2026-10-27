import { Request, Response, NextFunction } from "express";

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  const statusCode = err.statusCode || err.response?.status || 500;

  // Log server-side only.
  console.error("[Backend Error]", {
    requestId: (req as any).requestId,
    statusCode,
    message: err.message,
  });

  res.status(statusCode).json({
    error: true,
    message: "Internal Server Error",
  });
}
