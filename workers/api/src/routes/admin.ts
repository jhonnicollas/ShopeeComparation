import { Hono } from "hono";
import {
  listAllUsers,
  setUserStatus,
  revokeAllUserSessions,
} from "@shopee-research/db";
import { authenticate, authErrorResponse, requireAdmin } from "../lib/auth.js";

export const adminRouter = new Hono<{ Bindings: Bindings }>();

adminRouter.get("/users", async (c) => {
  const auth = await authenticate(c.env.DB, c.req.header("cookie"));
  if (!auth.authenticated) {
    const err = authErrorResponse(auth);
    return c.json(err.body, err.status as 401 | 403);
  }
  const adminCheck = requireAdmin(auth);
  if (!adminCheck.authenticated) {
    const err = authErrorResponse(adminCheck);
    return c.json(err.body, err.status as 401 | 403);
  }
  const users = await listAllUsers(c.env.DB);
  return c.json({ items: users }, 200);
});

adminRouter.post("/users/:id/disable", async (c) => {
  const auth = await authenticate(c.env.DB, c.req.header("cookie"));
  if (!auth.authenticated) {
    const err = authErrorResponse(auth);
    return c.json(err.body, err.status as 401 | 403);
  }
  const adminCheck = requireAdmin(auth);
  if (!adminCheck.authenticated) {
    const err = authErrorResponse(adminCheck);
    return c.json(err.body, err.status as 401 | 403);
  }
  const id = c.req.param("id");
  await setUserStatus(c.env.DB, id, "disabled");
  return c.json({ success: true }, 200);
});

adminRouter.post("/users/:id/enable", async (c) => {
  const auth = await authenticate(c.env.DB, c.req.header("cookie"));
  if (!auth.authenticated) {
    const err = authErrorResponse(auth);
    return c.json(err.body, err.status as 401 | 403);
  }
  const adminCheck = requireAdmin(auth);
  if (!adminCheck.authenticated) {
    const err = authErrorResponse(adminCheck);
    return c.json(err.body, err.status as 401 | 403);
  }
  const id = c.req.param("id");
  await setUserStatus(c.env.DB, id, "active");
  return c.json({ success: true }, 200);
});

adminRouter.post("/users/:id/revoke-sessions", async (c) => {
  const auth = await authenticate(c.env.DB, c.req.header("cookie"));
  if (!auth.authenticated) {
    const err = authErrorResponse(auth);
    return c.json(err.body, err.status as 401 | 403);
  }
  const adminCheck = requireAdmin(auth);
  if (!adminCheck.authenticated) {
    const err = authErrorResponse(adminCheck);
    return c.json(err.body, err.status as 401 | 403);
  }
  const id = c.req.param("id");
  const count = await revokeAllUserSessions(c.env.DB, id);
  return c.json({ success: true, revoked: count }, 200);
});

type Bindings = {
  DB: D1Database;
  LOGS: R2Bucket;
};
