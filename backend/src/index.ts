import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { env } from "./config/env";
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

app.get("/health", (_req, res) => {
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

const PORT = env.port;

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend API listening on port ${PORT}`);
});


