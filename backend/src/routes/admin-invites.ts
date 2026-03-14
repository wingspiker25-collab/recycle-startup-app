import { Router, Response } from "express";
import { pool } from "../db/pool";
import { requireAuth, requireAdmin, AuthRequest } from "../middleware/auth";

const router = Router();
router.use(requireAuth, requireAdmin);

// POST /api/admin/invites
router.post("/", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { emailOrPhone, role = "user" } = req.body;
    if (!emailOrPhone || typeof emailOrPhone !== "string") {
      res.status(400).json({ error: "emailOrPhone required" });
      return;
    }
    if (!["user", "admin", "driver"].includes(role)) {
      res.status(400).json({ error: "Invalid role" });
      return;
    }

    const { randomUUID } = await import("crypto");
    const id = randomUUID();
    const inviteToken = randomUUID().replace(/-/g, "").slice(0, 24);

    await pool.query(
      `INSERT INTO invites (id, email_or_phone, invite_token, role, created_by_admin_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, emailOrPhone.trim(), inviteToken, role, req.user!.userId]
    );

    const baseUrl = process.env.FRONTEND_URL || "https://recycle-startup-app.vercel.app";
    const inviteLink = `${baseUrl}/invite/${inviteToken}`;

    res.status(201).json({ inviteLink, inviteToken, id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
