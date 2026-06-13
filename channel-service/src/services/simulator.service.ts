import { randomUUID } from "crypto";
import type {
  ChannelEventPayload,
  SimulationRequest,
  CommunicationEventType,
} from "../types/simulation";
import { postJsonWithRetry, sleep } from "../utils/retry";
import { env } from "../config/env";

interface LaunchState {
  launchId: string;
  campaignId: string;
  startedAt: string;
  completed: boolean;
}

const activeLaunches = new Map<string, LaunchState>();

const sequenceFor = (eventType: CommunicationEventType): number => {
  return {
    SENT: 1,
    DELIVERED: 2,
    FAILED: 3,
    OPENED: 4,
    READ: 5,
    CLICKED: 6,
    PURCHASED: 7,
  }[eventType];
};

const shouldDeliver = (): boolean => Math.random() <= 0.95;
const shouldOpen = (): boolean => Math.random() <= 0.7;
const shouldRead = (): boolean => Math.random() <= 0.55;
const shouldClick = (): boolean => Math.random() <= 0.35;
const shouldPurchase = (): boolean => Math.random() <= 0.1;

const createEvent = (
  request: SimulationRequest,
  customerId: string,
  eventType: CommunicationEventType,
  amountImpact = 0
): ChannelEventPayload => ({
  communicationId: `COMM-${randomUUID().slice(0, 8).toUpperCase()}`,
  campaignId: request.campaignId,
  customerId,
  channel: request.recommendedChannel,
  eventType,
  timestamp: new Date().toISOString(),
  idempotencyKey: `${request.idempotencyKey}:${customerId}:${eventType}`,
  sequence: sequenceFor(eventType),
  amountImpact,
  source: "channel-service",
});

const delay = (base: number, speedFactor: number, multiplier = 1) => {
  return Math.max(120, Math.round(base * speedFactor * multiplier));
};

export const runSimulation = async (request: SimulationRequest): Promise<LaunchState> => {
  const launchId = randomUUID();

  if (activeLaunches.has(request.idempotencyKey)) {
    return activeLaunches.get(request.idempotencyKey)!;
  }

  const state: LaunchState = {
    launchId,
    campaignId: request.campaignId,
    startedAt: new Date().toISOString(),
    completed: false,
  };

  activeLaunches.set(request.idempotencyKey, state);

  const speedFactor = request.speedFactor ?? env.simulationSpeed;
  const audience = request.audience;

  const eventJobs = audience.map(async (customer, index) => {
    const baseOffset = 320 + index * 90;
    await sleep(delay(baseOffset, speedFactor));
    await postJsonWithRetry(request.callbackUrl, createEvent(request, customer.customerId, "SENT"), request.webhookSecret);

    if (!shouldDeliver()) {
      await sleep(delay(1800, speedFactor));
      await postJsonWithRetry(request.callbackUrl, createEvent(request, customer.customerId, "FAILED"), request.webhookSecret);
      return;
    }

    await sleep(delay(1600, speedFactor));
    const deliveredEvent = createEvent(request, customer.customerId, "DELIVERED");
    await postJsonWithRetry(request.callbackUrl, deliveredEvent, request.webhookSecret);

    if (index === 0) {
      await postJsonWithRetry(request.callbackUrl, deliveredEvent, request.webhookSecret);
    }

    if (!shouldOpen()) {
      return;
    }

    await sleep(delay(2200, speedFactor));
    await postJsonWithRetry(request.callbackUrl, createEvent(request, customer.customerId, "OPENED"), request.webhookSecret);

    if (shouldRead()) {
      await sleep(delay(1800, speedFactor));
      await postJsonWithRetry(request.callbackUrl, createEvent(request, customer.customerId, "READ"), request.webhookSecret);
    }

    if (!shouldClick()) {
      return;
    }

    await sleep(delay(2200, speedFactor));
    await postJsonWithRetry(request.callbackUrl, createEvent(request, customer.customerId, "CLICKED"), request.webhookSecret);

    if (!shouldPurchase()) {
      return;
    }

    const estimatedOrderValue = Math.round(customer.totalSpend * (0.08 + Math.random() * 0.06));
    await sleep(delay(2900, speedFactor));
    await postJsonWithRetry(
      request.callbackUrl,
      createEvent(request, customer.customerId, "PURCHASED", estimatedOrderValue),
      request.webhookSecret
    );
  });

  await Promise.all(eventJobs);

  await sleep(delay(500, speedFactor));
  await postJsonWithRetry(
    request.finishCallbackUrl,
    {
      campaignId: request.campaignId,
      launchId,
      idempotencyKey: `${request.idempotencyKey}:finished`,
    },
    request.webhookSecret
  );

  state.completed = true;
  return state;
};

export const getLaunches = (): LaunchState[] => Array.from(activeLaunches.values());

