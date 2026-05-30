import { Request, RequestHandler } from "express";

/** Wrap async handlers so thrown errors flow to errorHandler */
export const wrap = (fn: (req: Request, ...rest: any[]) => Promise<any>): RequestHandler =>
  (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
