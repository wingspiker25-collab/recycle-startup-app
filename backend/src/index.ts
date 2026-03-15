import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import authRoutes from "./routes/auth";
import invitesRoutes from "./routes/invites";
import adminInvitesRoutes from "./routes/admin-invites";
import pickupsRoutes from "./routes/pickups";
import { scrapRatesRouter, adminScrapRatesRouter } from "./routes/scrap-rates";
import adminPickupsRoutes from "./routes/admin-pickups";
import adminUsersRoutes from "./routes/admin-users";
import notificationsRoutes from "./routes/notifications";

const app = express();

app.use(helmet());
app.use(cors({ origin: true }));
app.use(express.json());
app.use(morgan("dev"));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get("/health", (_req: any, res: any) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/invites", invitesRoutes);
app.use("/api/admin/invites", adminInvitesRoutes);
app.use("/api/pickups", pickupsRoutes);
app.use("/api/scrap-rates", scrapRatesRouter);
app.use("/api/admin/scrap-rates", adminScrapRatesRouter);
app.use("/api/admin/pickups", adminPickupsRoutes);
app.use("/api/admin/users", adminUsersRoutes);
app.use("/api/notifications", notificationsRoutes);

// Global error handler
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = parseInt(process.env.PORT || "10000", 10);

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend API listening on port ${PORT}`);
});

server.on("error", (err: any) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use.`);
    process.exit(1);
  } else {
    console.error("Server error:", err);
    process.exit(1);
  }
});