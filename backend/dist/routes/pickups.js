"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const crypto_1 = require("crypto");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const pool_1 = require("../db/pool");
const env_1 = require("../config/env");
const auth_1 = require("../middleware/auth");
const messages_1 = __importDefault(require("./messages"));
const router = (0, express_1.Router)();
const uploadDir = path_1.default.join(process.cwd(), "uploads");
if (!fs_1.default.existsSync(uploadDir))
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => cb(null, `${(0, crypto_1.randomUUID)()}${path_1.default.extname(file.originalname) || ".jpg"}`),
});
const upload = (0, multer_1.default)({ storage, limits: { fileSize: 5 * 1024 * 1024 } });
// GET /api/pickups - user's own pickups
router.get("/", auth_1.requireAuth, async (req, res) => {
    try {
        const r = await pool_1.pool.query(`SELECT p.*, u.name as driver_name
       FROM pickups p
       LEFT JOIN users u ON p.driver_id = u.id
       WHERE p.user_id = $1
       ORDER BY p.created_at DESC`, [req.user.userId]);
        const pickups = r.rows.map((row) => ({
            id: row.id,
            addressText: row.address_text,
            scheduledAt: row.scheduled_at,
            pickupStatus: row.pickup_status,
            totalWeightKg: Number(row.total_weight_kg),
            estimatedAmount: Number(row.estimated_amount),
            finalAmountPaid: row.final_amount_paid ? Number(row.final_amount_paid) : null,
            driverName: row.driver_name,
            createdAt: row.created_at,
        }));
        res.json(pickups);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});
// GET /api/pickups/:id
router.get("/:id", auth_1.requireAuth, async (req, res) => {
    try {
        const r = await pool_1.pool.query(`SELECT p.*, u.name as driver_name
       FROM pickups p
       LEFT JOIN users u ON p.driver_id = u.id
       WHERE p.id = $1`, [req.params.id]);
        const row = r.rows[0];
        if (!row) {
            res.status(404).json({ error: "Pickup not found" });
            return;
        }
        if (row.user_id !== req.user.userId && req.user.role === "user") {
            res.status(403).json({ error: "Forbidden" });
            return;
        }
        const items = (await pool_1.pool.query("SELECT category, weight_kg, rate_per_kg, amount FROM scrap_items WHERE pickup_id = $1", [req.params.id])).rows;
        const images = (await pool_1.pool.query("SELECT id, image_url, uploaded_at FROM pickup_images WHERE pickup_id = $1 ORDER BY uploaded_at", [req.params.id])).rows;
        res.json({
            id: row.id,
            addressText: row.address_text,
            scheduledAt: row.scheduled_at,
            pickupStatus: row.pickup_status,
            totalWeightKg: Number(row.total_weight_kg),
            estimatedAmount: Number(row.estimated_amount),
            finalAmountPaid: row.final_amount_paid ? Number(row.final_amount_paid) : null,
            driverName: row.driver_name,
            createdAt: row.created_at,
            items: items.map((i) => ({
                category: i.category,
                weightKg: Number(i.weight_kg),
                ratePerKg: Number(i.rate_per_kg),
                amount: Number(i.amount),
            })),
            images: images.map((i) => ({ id: i.id, imageUrl: i.image_url })),
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});
// POST /api/pickups - create (60kg minimum)
router.post("/", auth_1.requireAuth, async (req, res) => {
    try {
        const { addressText, scheduledAt, items, latitude, longitude } = req.body;
        if (!addressText || !Array.isArray(items) || items.length === 0) {
            res.status(400).json({ error: "addressText and items (array) required" });
            return;
        }
        const ratesRes = await pool_1.pool.query(`SELECT DISTINCT ON (category) category, rate_per_kg FROM scrap_rates ORDER BY category, effective_from DESC`);
        const ratesMap = {};
        ratesRes.rows.forEach((r) => { ratesMap[r.category] = Number(r.rate_per_kg); });
        let totalWeight = 0;
        const scrapRows = [];
        for (const item of items) {
            const cat = String(item.category || "").trim();
            const w = Number(item.weightKg) || 0;
            if (!cat || w <= 0)
                continue;
            const rate = ratesMap[cat] ?? 0;
            const amount = w * rate;
            scrapRows.push({ category: cat, weightKg: w, ratePerKg: rate, amount });
            totalWeight += w;
        }
        if (totalWeight < env_1.env.minimumPickupWeightKg) {
            res.status(400).json({
                error: `Minimum pickup weight is ${env_1.env.minimumPickupWeightKg} kg. Total: ${totalWeight} kg`,
            });
            return;
        }
        const estimatedAmount = scrapRows.reduce((s, i) => s + i.amount, 0);
        const pickupId = (0, crypto_1.randomUUID)();
        const latNum = latitude != null ? Number(latitude) : NaN;
        const lngNum = longitude != null ? Number(longitude) : NaN;
        const lat = !isNaN(latNum) ? latNum : null;
        const lng = !isNaN(lngNum) ? lngNum : null;
        await pool_1.pool.query(`INSERT INTO pickups (id, user_id, address_text, latitude, longitude, scheduled_at, total_weight_kg, estimated_amount)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, [pickupId, req.user.userId, String(addressText).trim(), lat, lng, scheduledAt || null, totalWeight, estimatedAmount]);
        for (const s of scrapRows) {
            await pool_1.pool.query(`INSERT INTO scrap_items (id, pickup_id, category, weight_kg, rate_per_kg, amount)
         VALUES ($1, $2, $3, $4, $5, $6)`, [(0, crypto_1.randomUUID)(), pickupId, s.category, s.weightKg, s.ratePerKg, s.amount]);
        }
        res.status(201).json({ id: pickupId, totalWeightKg: totalWeight, estimatedAmount });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});
// Mount messages under /:id/messages
router.use("/:id/messages", (req, _res, next) => {
    req.params.pickupId = req.params.id;
    next();
}, messages_1.default);
// POST /api/pickups/:id/images
router.post("/:id/images", auth_1.requireAuth, upload.array("images", 5), async (req, res) => {
    try {
        const pickupId = req.params.id;
        const r = await pool_1.pool.query("SELECT user_id FROM pickups WHERE id = $1", [pickupId]);
        const row = r.rows[0];
        if (!row || row.user_id !== req.user.userId) {
            res.status(404).json({ error: "Pickup not found" });
            return;
        }
        const files = req.files;
        if (!files || files.length === 0) {
            res.status(400).json({ error: "No images uploaded" });
            return;
        }
        for (const f of files) {
            const imageUrl = `/uploads/${f.filename}`;
            await pool_1.pool.query(`INSERT INTO pickup_images (id, pickup_id, image_url) VALUES ($1, $2, $3)`, [(0, crypto_1.randomUUID)(), pickupId, imageUrl]);
        }
        res.status(201).json({ ok: true });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});
exports.default = router;
