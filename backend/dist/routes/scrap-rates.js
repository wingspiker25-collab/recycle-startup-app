"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminScrapRatesRouter = exports.scrapRatesRouter = void 0;
const express_1 = require("express");
const pool_1 = require("../db/pool");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
exports.scrapRatesRouter = router;
// GET /api/scrap-rates (public - current rates per category)
router.get("/", async (_req, res) => {
    try {
        const r = await pool_1.pool.query(`SELECT DISTINCT ON (category) category, rate_per_kg, effective_from
       FROM scrap_rates
       ORDER BY category, effective_from DESC`);
        const rates = {};
        r.rows.forEach((row) => { rates[row.category] = Number(row.rate_per_kg); });
        res.json(rates);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});
// GET /api/admin/scrap-rates (admin - full list with history)
const adminRouter = (0, express_1.Router)();
exports.adminScrapRatesRouter = adminRouter;
adminRouter.use(auth_1.requireAuth, auth_1.requireAdmin);
adminRouter.get("/", async (_req, res) => {
    try {
        const r = await pool_1.pool.query(`SELECT id, category, rate_per_kg, effective_from
       FROM scrap_rates
       ORDER BY category, effective_from DESC`);
        res.json(r.rows);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});
adminRouter.post("/", async (req, res) => {
    try {
        const { category, ratePerKg } = req.body;
        if (!category || typeof ratePerKg !== "number" || ratePerKg < 0) {
            res.status(400).json({ error: "category and ratePerKg (number >= 0) required" });
            return;
        }
        const { randomUUID } = await Promise.resolve().then(() => __importStar(require("crypto")));
        await pool_1.pool.query(`INSERT INTO scrap_rates (id, category, rate_per_kg, created_by_admin_id)
       VALUES ($1, $2, $3, $4)`, [randomUUID(), String(category).trim(), ratePerKg, req.user.userId]);
        res.status(201).json({ ok: true });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});
adminRouter.patch("/:category", async (req, res) => {
    try {
        const category = decodeURIComponent(req.params.category);
        const { ratePerKg } = req.body;
        if (typeof ratePerKg !== "number" || ratePerKg < 0) {
            res.status(400).json({ error: "ratePerKg (number >= 0) required" });
            return;
        }
        const { randomUUID } = await Promise.resolve().then(() => __importStar(require("crypto")));
        await pool_1.pool.query(`INSERT INTO scrap_rates (id, category, rate_per_kg, created_by_admin_id)
       VALUES ($1, $2, $3, $4)`, [randomUUID(), category, ratePerKg, req.user.userId]);
        res.json({ ok: true });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});
