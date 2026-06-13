"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLaunches = exports.runSimulation = void 0;
const crypto_1 = require("crypto");
const retry_1 = require("../utils/retry");
const env_1 = require("../config/env");
const activeLaunches = new Map();
const sequenceFor = (eventType) => {
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
const shouldDeliver = () => Math.random() <= 0.95;
const shouldOpen = () => Math.random() <= 0.7;
const shouldRead = () => Math.random() <= 0.55;
const shouldClick = () => Math.random() <= 0.35;
const shouldPurchase = () => Math.random() <= 0.1;
const createEvent = (request, customerId, eventType, amountImpact = 0) => ({
    communicationId: `COMM-${(0, crypto_1.randomUUID)().slice(0, 8).toUpperCase()}`,
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
const delay = (base, speedFactor, multiplier = 1) => {
    return Math.max(120, Math.round(base * speedFactor * multiplier));
};
const runSimulation = async (request) => {
    const launchId = (0, crypto_1.randomUUID)();
    if (activeLaunches.has(request.idempotencyKey)) {
        return activeLaunches.get(request.idempotencyKey);
    }
    const state = {
        launchId,
        campaignId: request.campaignId,
        startedAt: new Date().toISOString(),
        completed: false,
    };
    activeLaunches.set(request.idempotencyKey, state);
    const speedFactor = request.speedFactor ?? env_1.env.simulationSpeed;
    const audience = request.audience;
    const eventJobs = audience.map(async (customer, index) => {
        const baseOffset = 320 + index * 90;
        await (0, retry_1.sleep)(delay(baseOffset, speedFactor));
        await (0, retry_1.postJsonWithRetry)(request.callbackUrl, createEvent(request, customer.customerId, "SENT"), request.webhookSecret);
        if (!shouldDeliver()) {
            await (0, retry_1.sleep)(delay(1800, speedFactor));
            await (0, retry_1.postJsonWithRetry)(request.callbackUrl, createEvent(request, customer.customerId, "FAILED"), request.webhookSecret);
            return;
        }
        await (0, retry_1.sleep)(delay(1600, speedFactor));
        const deliveredEvent = createEvent(request, customer.customerId, "DELIVERED");
        await (0, retry_1.postJsonWithRetry)(request.callbackUrl, deliveredEvent, request.webhookSecret);
        if (index === 0) {
            await (0, retry_1.postJsonWithRetry)(request.callbackUrl, deliveredEvent, request.webhookSecret);
        }
        if (!shouldOpen()) {
            return;
        }
        await (0, retry_1.sleep)(delay(2200, speedFactor));
        await (0, retry_1.postJsonWithRetry)(request.callbackUrl, createEvent(request, customer.customerId, "OPENED"), request.webhookSecret);
        if (shouldRead()) {
            await (0, retry_1.sleep)(delay(1800, speedFactor));
            await (0, retry_1.postJsonWithRetry)(request.callbackUrl, createEvent(request, customer.customerId, "READ"), request.webhookSecret);
        }
        if (!shouldClick()) {
            return;
        }
        await (0, retry_1.sleep)(delay(2200, speedFactor));
        await (0, retry_1.postJsonWithRetry)(request.callbackUrl, createEvent(request, customer.customerId, "CLICKED"), request.webhookSecret);
        if (!shouldPurchase()) {
            return;
        }
        const estimatedOrderValue = Math.round(customer.totalSpend * (0.08 + Math.random() * 0.06));
        await (0, retry_1.sleep)(delay(2900, speedFactor));
        await (0, retry_1.postJsonWithRetry)(request.callbackUrl, createEvent(request, customer.customerId, "PURCHASED", estimatedOrderValue), request.webhookSecret);
    });
    await Promise.all(eventJobs);
    await (0, retry_1.sleep)(delay(500, speedFactor));
    await (0, retry_1.postJsonWithRetry)(request.finishCallbackUrl, {
        campaignId: request.campaignId,
        launchId,
        idempotencyKey: `${request.idempotencyKey}:finished`,
    }, request.webhookSecret);
    state.completed = true;
    return state;
};
exports.runSimulation = runSimulation;
const getLaunches = () => Array.from(activeLaunches.values());
exports.getLaunches = getLaunches;
//# sourceMappingURL=simulator.service.js.map