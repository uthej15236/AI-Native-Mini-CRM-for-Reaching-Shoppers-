import type { CampaignPlan } from "../types/marketing";
import { env } from "../config/env";

interface LaunchSimulationPayload {
  campaignId: string;
  objective: string;
  recommendedChannel: CampaignPlan["recommendedChannel"];
  audience: CampaignPlan["audiencePreview"];
  messages: CampaignPlan["messages"];
  idempotencyKey: string;
}

export const launchChannelSimulation = async (payload: LaunchSimulationPayload): Promise<void> => {
  const response = await fetch(env.channelServiceUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...payload,
      callbackUrl: `${env.publicApiUrl}/webhooks/channel-event`,
      finishCallbackUrl: `${env.publicApiUrl}/webhooks/channel-finished`,
      webhookSecret: env.webhookSecret,
      speedFactor: env.simulationSpeed,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Channel service rejected the launch: ${text}`);
  }
};

