import type { SimulationRequest } from "../types/simulation";
interface LaunchState {
    launchId: string;
    campaignId: string;
    startedAt: string;
    completed: boolean;
}
export declare const runSimulation: (request: SimulationRequest) => Promise<LaunchState>;
export declare const getLaunches: () => LaunchState[];
export {};
