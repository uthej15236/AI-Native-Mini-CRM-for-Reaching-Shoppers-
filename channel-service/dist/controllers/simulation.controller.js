"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.launchSimulation = void 0;
const simulator_service_1 = require("../services/simulator.service");
const launchSimulation = async (req, res, next) => {
    try {
        const payload = req.body;
        const state = await (0, simulator_service_1.runSimulation)(payload);
        res.status(202).json({
            success: true,
            message: "Simulation accepted",
            data: state,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.launchSimulation = launchSimulation;
//# sourceMappingURL=simulation.controller.js.map