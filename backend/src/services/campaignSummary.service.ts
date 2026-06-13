import { Campaign } from "../models/Campaign";
import { CommunicationEvent } from "../models/CommunicationEvent";
import type { CampaignMetricSnapshot, CampaignSummary } from "../types/marketing";
import { formatCurrency, safeDivide } from "../utils/marketing";

const emptyMetrics = (): CampaignMetricSnapshot => ({
  sent: 0,
  delivered: 0,
  failed: 0,
  opened: 0,
  read: 0,
  clicked: 0,
  purchased: 0,
});

export const buildCampaignSummary = (
  metrics: CampaignMetricSnapshot,
  revenueImpact: number
): CampaignSummary => {
  const audienceReached = metrics.delivered;
  const openRate = safeDivide(metrics.opened, audienceReached);
  const clickRate = safeDivide(metrics.clicked, audienceReached);
  const failureRate = safeDivide(metrics.failed, Math.max(metrics.sent, 1));
  const recommendations: string[] = [];

  if (failureRate > 0.08) {
    recommendations.push("Reduce send pressure or shift more volume to the better-performing channel.");
  }

  if (openRate < 0.55) {
    recommendations.push("Test a sharper first line or a more urgent incentive.");
  }

  if (clickRate < 0.25) {
    recommendations.push("Move the CTA higher and make the offer easier to understand in one glance.");
  }

  if (revenueImpact > 0) {
    recommendations.push(
      `The campaign produced an estimated ${formatCurrency(revenueImpact)} in uplift. Re-run this cohort with a lighter variation in 10-14 days.`
    );
  }

  if (recommendations.length === 0) {
    recommendations.push("The flow is healthy. Duplicate this structure for a neighboring segment.");
  }

  return {
    audienceReached,
    openRate: Number(openRate.toFixed(2)),
    clickRate: Number(clickRate.toFixed(2)),
    estimatedRevenueImpact: revenueImpact,
    recommendations,
    funnel: metrics,
  };
};

export const recomputeCampaignSummary = async (campaignId: string): Promise<CampaignSummary | null> => {
  const campaign = await Campaign.findOne({ campaignId });
  if (!campaign) {
    return null;
  }

  const events = await CommunicationEvent.find({ campaign: campaign._id });
  const metrics = events.reduce<CampaignMetricSnapshot>((accumulator, event) => {
    accumulator[event.eventType === "SENT" ? "sent" : event.eventType === "DELIVERED" ? "delivered" : event.eventType === "FAILED" ? "failed" : event.eventType === "OPENED" ? "opened" : event.eventType === "READ" ? "read" : event.eventType === "CLICKED" ? "clicked" : "purchased"] += 1;
    return accumulator;
  }, emptyMetrics());

  const revenueImpact = events
    .filter((event) => event.eventType === "PURCHASED")
    .reduce((sum, event) => sum + event.amountImpact, 0);

  const summary = buildCampaignSummary(metrics, revenueImpact);
  campaign.metrics = metrics;
  campaign.summary = summary;
  campaign.status = "COMPLETED";
  campaign.completedAt = new Date();
  await campaign.save();

  return summary;
};

export const updateCampaignMetrics = async (
  campaignId: string,
  metricsPatch: Partial<CampaignMetricSnapshot>,
  revenueImpactDelta = 0
): Promise<CampaignSummary | null> => {
  const campaign = await Campaign.findOne({ campaignId });
  if (!campaign) {
    return null;
  }

  campaign.metrics = {
    sent: campaign.metrics.sent + (metricsPatch.sent ?? 0),
    delivered: campaign.metrics.delivered + (metricsPatch.delivered ?? 0),
    failed: campaign.metrics.failed + (metricsPatch.failed ?? 0),
    opened: campaign.metrics.opened + (metricsPatch.opened ?? 0),
    read: campaign.metrics.read + (metricsPatch.read ?? 0),
    clicked: campaign.metrics.clicked + (metricsPatch.clicked ?? 0),
    purchased: campaign.metrics.purchased + (metricsPatch.purchased ?? 0),
  };

  const summary = buildCampaignSummary(campaign.metrics, revenueImpactDelta);
  if (campaign.status === "RUNNING" || campaign.status === "PLANNED") {
    campaign.summary = summary;
  }

  await campaign.save();
  return summary;
};

