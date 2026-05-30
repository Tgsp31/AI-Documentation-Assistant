/**
 * Lightweight RBAC unit tests (no DB required).
 */
import { requireRole } from "../src/middleware/auth";
import { HttpError } from "../src/middleware/error";

function run(role: any, allowed: any[]) {
  const req: any = { user: role ? { id: "u", email: "e", role } : undefined };
  const mw = requireRole(...allowed);
  try { mw(req, {} as any, () => {}); return "ok"; }
  catch (e: any) { return e instanceof HttpError ? e.status : "throw"; }
}

describe("RBAC", () => {
  it("allows matching role", () => expect(run("admin", ["admin"])).toBe("ok"));
  it("forbids mismatched role", () => expect(run("viewer", ["admin"])).toBe(403));
  it("401 when no user", () => expect(run(null, ["admin"])).toBe(401));
});
