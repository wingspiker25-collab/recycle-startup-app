"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const pool_1 = require("../db/pool");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth, auth_1.requireAdmin);
// GET /api/admin/users
router.get("/", async (_req, res) => {
    try {
        const r = await pool_1.pool.query(`SELECT u.id, u.name, u.phone, u.email, u.role, u.created_at,
        (SELECT COUNT(*) FROM pickups WHERE user_id = u.id)::int as pickup_count,
        (SELECT COALESCE(SUM(si.weight_kg), 0) FROM pickups p2
         JOIN scrap_items si ON si.pickup_id = p2.id WHERE p2.user_id = u.id AND p2.pickup_status = 'picked_up') as total_weight,
        (SELECT COALESCE(SUM(pay.amount), 0) FROM payments pay WHERE pay.user_id = u.id) as total_paid,
        (SELECT COALESCE(SUM(p.estimated_amount), 0) FROM pickups p
         WHERE p.user_id = u.id AND p.pickup_status = 'picked_up' AND p.final_amount_paid IS NULL) as amount_due
       FROM users u
       WHERE u.role = 'user'
       ORDER BY u.name`);
        res.json(r.rows.map((row) => ({
            id: row.id,
            name: row.name,
            phone: row.phone,
            email: row.email,
            role: row.role,
            createdAt: row.created_at,
            pickupCount: Number(row.pickup_count) || 0,
            totalWeightKg: Number(row.total_weight) || 0,
            totalPaid: Number(row.total_paid) || 0,
            amountDue: Number(row.amount_due) || 0,
        })));
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});
// GET /api/admin/users/:id/history - pickup history for a user
router.get("/:id/history", async (req, res) => {
    try {
        const userId = req.params.id;
        const r = await pool_1.pool.query(`SELECT p.id, p.address_text, p.pickup_status, p.total_weight_kg, p.estimated_amount,
        p.final_amount_paid, p.created_at
       FROM pickups p
       WHERE p.user_id = $1
       ORDER BY p.created_at DESC`, [userId]);
        const userRow = (await pool_1.pool.query("SELECT name, phone FROM users WHERE id = $1", [userId])).rows[0];
        if (!userRow) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        res.json({
            userName: userRow.name,
            userPhone: userRow.phone,
            pickups: r.rows.map((row) => ({
                id: row.id,
                addressText: row.address_text,
                pickupStatus: row.pickup_status,
                totalWeightKg: Number(row.total_weight_kg),
                estimatedAmount: Number(row.estimated_amount),
                finalAmountPaid: row.final_amount_paid ? Number(row.final_amount_paid) : null,
                createdAt: row.created_at,
            })),
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});
exports.default = router;
