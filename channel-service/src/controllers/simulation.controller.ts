import type { RequestHandler } from "express";
import { runSimulation } from "../services/simulator.service";
import type { SimulationRequest } from "../types/simulation";

export const launchSimulation: RequestHandler = async (req, res, next) => {
  try {
    const payload = req.body as SimulationRequest;
    const state = await runSimulation(payload);

    res.status(202).json({
      success: true,
      message: "Simulation accepted",
      data: state,
    });
  } catch (error) {
    next(error);
  }
};

