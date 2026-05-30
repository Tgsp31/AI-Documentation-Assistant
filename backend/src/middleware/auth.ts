import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { HttpError } from "./error";

export type Role = "admin" | "editor" | "viewer";
export interface AuthUser { id: string; email: string; role: Role; }

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express { interface Request { user?: AuthUser } }
}

export function authRequired(req: Request, _res: Response, next: NextFunction) {
  const h = req.headers.authorization;
  if (!h?.startsWith("Bearer ")) throw new HttpError(401, "Missing bearer token");
  try {
    const payload = jwt.verify(h.slice(7), env.JWT_ACCESS_SECRET) as AuthUser & { iat: number };
    req.user = { id: payload.id, email: payload.email, role: payload.role };
    next();
  } catch {
    throw new HttpError(401, "Invalid or expired token");
  }
}

export function requireRole(...allowed: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw new HttpError(401, "Unauthenticated");
    if (!allowed.includes(req.user.role)) throw new HttpError(403, "Forbidden");
    next();
  };
}
