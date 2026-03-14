"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const pool_1 = require("../db/pool");
const router = (0, express_1.Router)();
// GET /api/invites/:token (public - validate invite for signup page)
router.get("/:token", async (req, res) => {
    try {
        const { token } = req.params;
        const r = await pool_1.pool.query(`SELECT id, email_or_phone, role, status, expires_at
       FROM invites WHERE invite_token = $1 LIMIT 1`, [token]);
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
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});
exports.default = router;
