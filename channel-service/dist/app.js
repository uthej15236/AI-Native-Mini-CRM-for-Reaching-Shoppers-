"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const simulation_routes_1 = __importDefault(require("./routes/simulation.routes"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use((0, helmet_1.default)());
app.use((0, morgan_1.default)("dev"));
app.use(express_1.default.json({ limit: "1mb" }));
app.get("/api/health", (_req, res) => {
    res.status(200).json({
        success: true,
        message: "Channel simulator is healthy",
    });
});
app.use("/api/simulations", simulation_routes_1.default);
app.use((error, _req, res, _next) => {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
        success: false,
        message,
    });
});
exports.default = app;
//# sourceMappingURL=app.js.map