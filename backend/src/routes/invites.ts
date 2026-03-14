import { Router, Response } from "express";
import { pool } from "../db/pool";

const router = Router();

// GET /api/invites/:token (public - validate invite for signup page)
router.get("/:token", async (req, res: Response): Promise<void> => {
  try {
    const { token } = req.params;
    const r = await pool.query(
      `SELECT id, email_or_phone, role, status, expires_at
       FROM invites WHERE invite_token = $1 LIMIT 1`,
      [token]
    );
    const row = r.rows[0];
    if (!row) {
      res.status(404).json({ error: "Invalid or expired invite" });
      return;
    }
    if (row.status !== "pending") {
      res.status(400).json({ error: "This invite has already been used" });
      return;
    }
    if (row.expires_at && new Date(row.expires_at) < new Date()) {
      res.status(400).json({ error: "This invite has expired" });
      return;
    }
    res.json({ emailOrPhone: row.email_or_phone, role: row.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
