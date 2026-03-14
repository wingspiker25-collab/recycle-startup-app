import { Router, Response } from "express";
import { randomUUID } from "crypto";
import { pool } from "../db/pool";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router({ mergeParams: true });

// GET /api/pickups/:pickupId/messages
router.get("/", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const pickupId = (req.params as any).pickupId || req.params.id;
    const r = await pool.query("SELECT user_id FROM pickups WHERE id = $1", [pickupId]);
    const row = r.rows[0];
    if (!row) {
      res.status(404).json({ error: "Pickup not found" });
      return;
    }
    const isOwner = row.user_id === req.user!.userId;
    const isAdminOrDriver = req.user!.role === "admin" || req.user!.role === "driver";
    if (!isOwner && !isAdminOrDriver) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const msgs = await pool.query(
      `SELECT m.id, m.content, m.created_at, m.sender_id, u.name as sender_name
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.pickup_id = $1
       ORDER BY m.created_at ASC`,
      [pickupId]
    );
    res.json(msgs.rows.map((m) => ({
      id: m.id,
      content: m.content,
      createdAt: m.created_at,
      senderId: m.sender_id,
      senderName: m.sender_name,
      isMe: m.sender_id === req.user!.userId,
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/pickups/:pickupId/messages
router.post("/", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const pickupId = (req.params as any).pickupId || req.params.id;
    const { content } = req.body;
    if (!content || typeof content !== "string" || !content.trim()) {
      res.status(400).json({ error: "content required" });
      return;
    }

    const r = await pool.query("SELECT user_id FROM pickups WHERE id = $1", [pickupId]);
    const row = r.rows[0];
    if (!row) {
      res.status(404).json({ error: "Pickup not found" });
      return;
    }
    const isOwner = row.user_id === req.user!.userId;
    const isAdminOrDriver = req.user!.role === "admin" || req.user!.role === "driver";
    if (!isOwner && !isAdminOrDriver) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const receiverRole = isOwner ? "admin" : "user";
    const id = randomUUID();
    await pool.query(
      `INSERT INTO messages (id, pickup_id, sender_id, receiver_role, content)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, pickupId, req.user!.userId, receiverRole, content.trim()]
    );

    const msg = (await pool.query(
      `SELECT m.id, m.content, m.created_at, u.name as sender_name
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.id = $1`,
      [id]
    )).rows[0];

    res.status(201).json({
      id: msg.id,
      content: msg.content,
      createdAt: msg.created_at,
      senderName: msg.sender_name,
      isMe: true,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
