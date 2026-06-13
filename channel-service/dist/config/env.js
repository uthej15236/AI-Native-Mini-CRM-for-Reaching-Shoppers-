"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const requireEnv = (key) => {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
};
exports.env = {
    port: Number(process.env.PORT ?? 5100),
    nodeEnv: process.env.NODE_ENV ?? "development",
    webhookSecret: requireEnv("WEBHOOK_SECRET"),
    simulationSpeed: Number(process.env.SIMULATION_SPEED ?? 0.45),
};
//# sourceMappingURL=env.js.map