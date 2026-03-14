import { Router, Response } from "express";
import { pool } from "../db/pool";
import { requireAuth, requireAdmin, AuthRequest } from "../middleware/auth";

const router = Router();

// GET /api/scrap-rates (public - current rates per category)
router.get("/", async (_req, res: Response): Promise<void> => {
  try {
    const r = await pool.query(
      `SELECT DISTINCT ON (category) category, rate_per_kg, effective_from
       FROM scrap_rates
       ORDER BY category, effective_from DESC`
    );
    const rates: Record<string, number> = {};
    r.rows.forEach((row) => { rates[row.category] = Number(row.rate_per_kg); });
    res.json(rates);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/admin/scrap-rates (admin - full list with history)
const adminRouter = Router();
adminRouter.use(requireAuth, requireAdmin);

adminRouter.get("/", async (_req, res: Response): Promise<void> => {
  try {
    const r = await pool.query(
      `SELECT id, category, rate_per_kg, effective_from
       FROM scrap_rates
       ORDER BY category, effective_from DESC`
    );
    res.json(r.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

adminRouter.post("/", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { category, ratePerKg } = req.body;
    if (!category || typeof ratePerKg !== "number" || ratePerKg < 0) {
      res.status(400).json({ error: "category and ratePerKg (number >= 0) required" });
      return;
    }
    const { randomUUID } = await import("crypto");
    await pool.query(
      `INSERT INTO scrap_rates (id, category, rate_per_kg, created_by_admin_id)
       VALUES ($1, $2, $3, $4)`,
      [randomUUID(), String(category).trim(), ratePerKg, req.user!.userId]
    );
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

adminRouter.patch("/:category", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const category = decodeURIComponent(req.params.category);
    const { ratePerKg } = req.body;
    if (typeof ratePerKg !== "number" || ratePerKg < 0) {
      res.status(400).json({ error: "ratePerKg (number >= 0) required" });
      return;
    }
    const { randomUUID } = await import("crypto");
    await pool.query(
      `INSERT INTO scrap_rates (id, category, rate_per_kg, created_by_admin_id)
       VALUES ($1, $2, $3, $4)`,
      [randomUUID(), category, ratePerKg, req.user!.userId]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export { router as scrapRatesRouter, adminRouter as adminScrapRatesRouter };
