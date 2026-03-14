"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const crypto_1 = require("crypto");
const pool_1 = require("../db/pool");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth, auth_1.requireAdmin);
// GET /api/admin/pickups
router.get("/", async (req, res) => {
    try {
        const status = req.query.status;
        let sql = `
      SELECT p.*, u.name as user_name, u.phone, d.name as driver_name
      FROM pickups p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN users d ON p.driver_id = d.id
      WHERE 1=1`;
        const params = [];
        if (status) {
            params.push(status);
            sql += ` AND p.pickup_status = $${params.length}`;
        }
        sql += ` ORDER BY p.created_at DESC`;
        const r = await pool_1.pool.query(sql, params);
        res.json(r.rows.map((row) => ({
            id: row.id,
            userId: row.user_id,
            userName: row.user_name,
            userPhone: row.phone,
            addressText: row.address_text,
            scheduledAt: row.scheduled_at,
            pickupStatus: row.pickup_status,
            totalWeightKg: Number(row.total_weight_kg),
            estimatedAmount: Number(row.estimated_amount),
            finalAmountPaid: row.final_amount_paid ? Number(row.final_amount_paid) : null,
            driverId: row.driver_id,
            driverName: row.driver_name,
            createdAt: row.created_at,
        })));
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});
// GET /api/admin/pickups/:id
router.get("/:id", async (req, res) => {
    try {
        const r = await pool_1.pool.query(`SELECT p.*, u.name as user_name, u.phone, d.name as driver_name
       FROM pickups p
       JOIN users u ON p.user_id = u.id
       LEFT JOIN users d ON p.driver_id = d.id
       WHERE p.id = $1`, [req.params.id]);
        const row = r.rows[0];
        if (!row) {
            res.status(404).json({ error: "Pickup not found" });
            return;
        }
        const [items, images, drivers] = await Promise.all([
            pool_1.pool.query("SELECT category, weight_kg, rate_per_kg, amount FROM scrap_items WHERE pickup_id = $1", [req.params.id]),
            pool_1.pool.query("SELECT id, image_url FROM pickup_images WHERE pickup_id = $1", [req.params.id]),
            pool_1.pool.query("SELECT id, name FROM users WHERE role = 'driver' ORDER BY name"),
        ]);
        res.json({
            ...row,
            items: items.rows,
            images: images.rows,
            drivers: drivers.rows,
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});
// PATCH /api/admin/pickups/:id
router.patch("/:id", async (req, res) => {
    try {
        const { pickupStatus, driverId, scheduledAt, finalAmountPaid } = req.body;
        const updates = [];
        const params = [];
        let idx = 1;
        if (pickupStatus !== undefined) {
            updates.push(`pickup_status = $${idx++}`);
            params.push(pickupStatus);
        }
        if (driverId !== undefined) {
            updates.push(`driver_id = $${idx++}`);
            params.push(driverId || null);
        }
        if (scheduledAt !== undefined) {
            updates.push(`scheduled_at = $${idx++}`);
            params.push(scheduledAt || null);
        }
        if (finalAmountPaid !== undefined) {
            updates.push(`final_amount_paid = $${idx++}`);
            params.push(finalAmountPaid);
        }
        if (updates.length === 0) {
            res.status(400).json({ error: "No updates provided" });
            return;
        }
        updates.push(`updated_at = NOW()`);
        params.push(req.params.id);
        await pool_1.pool.query(`UPDATE pickups SET ${updates.join(", ")} WHERE id = $${idx}`, params);
        res.json({ ok: true });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});
// POST /api/admin/pickups/:id/payments
router.post("/:id/payments", async (req, res) => {
    try {
        const { amount, method } = req.body;
        if (typeof amount !== "number" || amount < 0 || !method) {
            res.status(400).json({ error: "amount (number) and method required" });
            return;
        }
        const r = await pool_1.pool.query("SELECT user_id FROM pickups WHERE id = $1", [req.params.id]);
        const row = r.rows[0];
        if (!row) {
            res.status(404).json({ error: "Pickup not found" });
            return;
        }
        await pool_1.pool.query(`INSERT INTO payments (id, pickup_id, user_id, amount, method) VALUES ($1, $2, $3, $4, $5)`, [(0, crypto_1.randomUUID)(), req.params.id, row.user_id, amount, String(method)]);
        await pool_1.pool.query(`UPDATE pickups SET final_amount_paid = $1, updated_at = NOW() WHERE id = $2`, [amount, req.params.id]);
        res.status(201).json({ ok: true });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});
exports.default = router;
