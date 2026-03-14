"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const pool_1 = require("../db/pool");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// GET /api/notifications - recent pickup status changes for current user
router.get("/", auth_1.requireAuth, async (req, res) => {
    try {
        const r = await pool_1.pool.query(`SELECT p.id, p.pickup_status, p.scheduled_at, p.updated_at, p.address_text
       FROM pickups p
       WHERE p.user_id = $1
       AND p.pickup_status IN ('driver_assigned', 'on_the_way', 'picked_up')
       ORDER BY p.updated_at DESC
       LIMIT 20`, [req.user.userId]);
        const notifications = r.rows.map((row) => {
            let message = "";
            if (row.pickup_status === "driver_assigned" && row.scheduled_at) {
                message = `Pickup scheduled for ${new Date(row.scheduled_at).toLocaleString()}`;
            }
            else if (row.pickup_status === "on_the_way") {
                message = "Driver is on the way";
            }
            else if (row.pickup_status === "picked_up") {
                message = "Pickup completed";
            }
            else {
                message = `Status: ${row.pickup_status}`;
            }
            return {
                id: row.id,
                message,
                pickupStatus: row.pickup_status,
                scheduledAt: row.scheduled_at,
                updatedAt: row.updated_at,
                addressText: row.address_text?.slice(0, 50),
            };
        });
        res.json(notifications);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});
exports.default = router;
