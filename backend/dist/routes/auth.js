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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const pool_1 = require("../db/pool");
const env_1 = require("../config/env");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
function signToken(userId, role) {
    return jsonwebtoken_1.default.sign({ userId, role }, env_1.env.jwtSecret, { expiresIn: "7d" });
}
// POST /api/auth/login
router.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            res.status(400).json({ error: "Username and password required" });
            return;
        }
        const r = await pool_1.pool.query(`SELECT id, name, phone, email, username, hashed_password, role
       FROM users WHERE username = $1 LIMIT 1`, [username.trim()]);
        const row = r.rows[0];
        if (!row) {
            res.status(401).json({ error: "Invalid credentials" });
            return;
        }
        const match = await bcryptjs_1.default.compare(password, row.hashed_password);
        if (!match) {
            res.status(401).json({ error: "Invalid credentials" });
            return;
        }
        const token = signToken(row.id, row.role);
        res.json({
            token,
            user: {
                id: row.id,
                name: row.name,
                phone: row.phone,
                email: row.email,
                username: row.username,
                role: row.role,
            },
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});
// POST /api/auth/send-otp
router.post("/send-otp", async (req, res) => {
    try {
        const { emailOrPhone } = req.body;
        if (!emailOrPhone) {
            res.status(400).json({ error: "Email or phone required" });
            return;
        }
        // Check if user already exists
        const existing = await pool_1.pool.query("SELECT id FROM users WHERE phone = $1 OR email = $1 OR username = $1", [emailOrPhone.trim()]);
        if (existing.rows.length > 0) {
            res.status(400).json({ error: "User already exists" });
            return;
        }
        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        const { randomUUID } = await Promise.resolve().then(() => __importStar(require("crypto")));
        const id = randomUUID();
        await pool_1.pool.query("INSERT INTO otps (id, email_or_phone, otp_code, expires_at) VALUES ($1, $2, $3, $4)", [id, emailOrPhone.trim(), otp, expiresAt]);
        // TODO: Send OTP via SMS or email
        console.log(`OTP for ${emailOrPhone}: ${otp}`);
        res.json({ message: "OTP sent" });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});
// POST /api/auth/signup-with-otp
router.post("/signup-with-otp", async (req, res) => {
    try {
        const { emailOrPhone, otp, name, username, password } = req.body;
        if (!emailOrPhone || !otp || !name || !username || !password) {
            res.status(400).json({ error: "All fields required" });
            return;
        }
        // Verify OTP
        const otpRow = await pool_1.pool.query("SELECT id FROM otps WHERE email_or_phone = $1 AND otp_code = $2 AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1", [emailOrPhone.trim(), otp]);
        if (otpRow.rows.length === 0) {
            res.status(400).json({ error: "Invalid or expired OTP" });
            return;
        }
        // Check if user already exists
        const existing = await pool_1.pool.query("SELECT id FROM users WHERE phone = $1 OR email = $1 OR username = $2", [emailOrPhone.trim(), username.trim()]);
        if (existing.rows.length > 0) {
            res.status(400).json({ error: "User already exists" });
            return;
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const { randomUUID } = await Promise.resolve().then(() => __importStar(require("crypto")));
        const userId = randomUUID();
        const phone = emailOrPhone.includes("@") ? null : emailOrPhone.trim();
        const email = emailOrPhone.includes("@") ? emailOrPhone.trim() : null;
        await pool_1.pool.query(`INSERT INTO users (id, name, phone, email, username, hashed_password, role)
       VALUES ($1, $2, $3, $4, $5, $6, 'user')`, [userId, name.trim(), phone, email, username.trim(), hashedPassword]);
        // Delete used OTP
        await pool_1.pool.query("DELETE FROM otps WHERE id = $1", [otpRow.rows[0].id]);
        const token = signToken(userId, "user");
        const userRow = (await pool_1.pool.query("SELECT id, name, phone, email, username, role FROM users WHERE id = $1", [userId])).rows[0];
        res.status(201).json({
            token,
            user: {
                id: userRow.id,
                name: userRow.name,
                phone: userRow.phone,
                email: userRow.email,
                username: userRow.username,
                role: userRow.role,
            },
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});
// POST /api/auth/signup-with-invite
router.post("/signup-with-invite", async (req, res) => {
    try {
        const { inviteToken, name, phone, email, username, password } = req.body;
        if (!inviteToken || !name || !phone || !username || !password) {
            res.status(400).json({ error: "Invite token, name, phone, username, and password required" });
            return;
        }
        const inv = await pool_1.pool.query(`SELECT id, email_or_phone, role, status, expires_at, created_by_admin_id
       FROM invites WHERE invite_token = $1 LIMIT 1`, [inviteToken]);
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
        const existing = await pool_1.pool.query("SELECT id FROM users WHERE phone = $1 OR email = $2 OR username = $3", [phone.trim(), (email || "").trim() || "never@never.never", username.trim()]);
        if (existing.rows.length > 0) {
            res.status(400).json({ error: "Phone, email, or username already registered" });
            return;
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const { randomUUID } = await Promise.resolve().then(() => __importStar(require("crypto")));
        const userId = randomUUID();
        await pool_1.pool.query(`INSERT INTO users (id, name, phone, email, username, hashed_password, role)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`, [userId, name.trim(), phone.trim(), email?.trim() || null, username.trim(), hashedPassword, invRow.role]);
        await pool_1.pool.query("UPDATE invites SET status = 'accepted' WHERE id = $1", [invRow.id]);
        const token = signToken(userId, invRow.role);
        const userRow = (await pool_1.pool.query("SELECT id, name, phone, email, username, role FROM users WHERE id = $1", [userId])).rows[0];
        res.status(201).json({
            token,
            user: {
                id: userRow.id,
                name: userRow.name,
                phone: userRow.phone,
                email: userRow.email,
                username: userRow.username,
                role: userRow.role,
            },
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});
// GET /api/auth/me
router.get("/me", auth_1.requireAuth, async (req, res) => {
    try {
        const r = await pool_1.pool.query("SELECT id, name, phone, email, username, role FROM users WHERE id = $1", [req.user.userId]);
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
            username: row.username,
            role: row.role,
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});
exports.default = router;
