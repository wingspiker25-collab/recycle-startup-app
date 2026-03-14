import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../db/pool";
import { env } from "../config/env";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { UserRole } from "../config/database";

const router = Router();

function signToken(userId: string, role: UserRole): string {
  return jwt.sign({ userId, role }, env.jwtSecret, { expiresIn: "7d" });
}

// POST /api/auth/login
router.post("/login", async (req, res: Response): Promise<void> => {
  try {
    const { phoneOrEmail, password } = req.body;
    if (!phoneOrEmail || !password) {
      res.status(400).json({ error: "Phone/email and password required" });
      return;
    }

    const r = await pool.query(
      `SELECT id, name, phone, email, hashed_password, role
       FROM users WHERE phone = $1 OR email = $1 LIMIT 1`,
      [phoneOrEmail.trim()]
    );
    const row = r.rows[0];
    if (!row) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const match = await bcrypt.compare(password, row.hashed_password);
    if (!match) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const token = signToken(row.id, row.role as UserRole);
    res.json({
      token,
      user: {
        id: row.id,
        name: row.name,
        phone: row.phone,
        email: row.email,
        role: row.role,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/auth/signup-with-invite
router.post("/signup-with-invite", async (req, res: Response): Promise<void> => {
  try {
    const { inviteToken, name, phone, email, password } = req.body;
    if (!inviteToken || !name || !phone || !password) {
      res.status(400).json({ error: "Invite token, name, phone, and password required" });
      return;
    }

    const inv = await pool.query(
      `SELECT id, email_or_phone, role, status, expires_at, created_by_admin_id
       FROM invites WHERE invite_token = $1 LIMIT 1`,
      [inviteToken]
    );
    const invRow = inv.rows[0];
    if (!invRow) {
      res.status(404).json({ error: "Invalid or expired invite" });
      return;
    }
    if (invRow.status !== "pending") {
      res.status(400).json({ error: "This invite has already been used" });
      return;
    }
    if (invRow.expires_at && new Date(invRow.expires_at) < new Date()) {
      res.status(400).json({ error: "This invite has expired" });
      return;
    }

    const existing = await pool.query(
      "SELECT id FROM users WHERE phone = $1 OR email = $2",
      [phone.trim(), (email || "").trim() || "never@never.never"]
    );
    if (existing.rows.length > 0) {
      res.status(400).json({ error: "Phone or email already registered" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const { randomUUID } = await import("crypto");
    const userId = randomUUID();

    await pool.query(
      `INSERT INTO users (id, name, phone, email, hashed_password, role)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, name.trim(), phone.trim(), email?.trim() || null, hashedPassword, invRow.role]
    );

    await pool.query(
      "UPDATE invites SET status = 'accepted' WHERE id = $1",
      [invRow.id]
    );

    const token = signToken(userId, invRow.role as UserRole);
    const userRow = (await pool.query(
      "SELECT id, name, phone, email, role FROM users WHERE id = $1",
      [userId]
    )).rows[0];

    res.status(201).json({
      token,
      user: {
        id: userRow.id,
        name: userRow.name,
        phone: userRow.phone,
        email: userRow.email,
        role: userRow.role,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/auth/me
router.get("/me", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const r = await pool.query(
      "SELECT id, name, phone, email, role FROM users WHERE id = $1",
      [req.user!.userId]
    );
    const row = r.rows[0];
    if (!row) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({
      id: row.id,
      name: row.name,
      phone: row.phone,
      email: row.email,
      role: row.role,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
