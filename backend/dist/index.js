"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const path_1 = __importDefault(require("path"));
const auth_1 = __importDefault(require("./routes/auth"));
const invites_1 = __importDefault(require("./routes/invites"));
const admin_invites_1 = __importDefault(require("./routes/admin-invites"));
const pickups_1 = __importDefault(require("./routes/pickups"));
const scrap_rates_1 = require("./routes/scrap-rates");
const admin_pickups_1 = __importDefault(require("./routes/admin-pickups"));
const admin_users_1 = __importDefault(require("./routes/admin-users"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({ origin: true }));
app.use(express_1.default.json());
app.use((0, morgan_1.default)("dev"));
app.use("/uploads", express_1.default.static(path_1.default.join(process.cwd(), "uploads")));
app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});
app.use("/api/auth", auth_1.default);
app.use("/api/invites", invites_1.default);
app.use("/api/admin/invites", admin_invites_1.default);
app.use("/api/pickups", pickups_1.default);
app.use("/api/scrap-rates", scrap_rates_1.scrapRatesRouter);
app.use("/api/admin/scrap-rates", scrap_rates_1.adminScrapRatesRouter);
app.use("/api/admin/pickups", admin_pickups_1.default);
app.use("/api/admin/users", admin_users_1.default);
app.use("/api/notifications", notifications_1.default);
const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Backend API listening on port ${PORT}`);
});
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please use a different port or stop the process using it.`);
        process.exit(1);
    }
    else {
        console.error('Server error:', err);
        process.exit(1);
    }
});
