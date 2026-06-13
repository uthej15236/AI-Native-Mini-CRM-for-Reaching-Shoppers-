import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Badge from "../components/ui/Badge";
import MetricCard from "../components/ui/MetricCard";
import Panel from "../components/ui/Panel";
import SelectField from "../components/ui/SelectField";
import { formatCurrency, formatDateTime, formatPercent, labelEvent, labelStatus } from "../lib/format";
import { xenoApi } from "../lib/xenoApi";
import type { CampaignRecord, CampaignStatus, CampaignTimelineEvent } from "../types/xeno";

const statusTone: Record<CampaignStatus, "primary" | "success" | "warning" | "danger" | "neutral"> = {
  DRAFT: "neutral",
  PLANNED: "warning",
  RUNNING: "primary",
  COMPLETED: "success",
  FAILED: "danger",
};

const eventTone: Record<CampaignTimelineEvent["eventType"], "primary" | "success" | "warning" | "danger" | "neutral"> = {
  SENT: "neutral",
  DELIVERED: "success",
  FAILED: "danger",
  OPENED: "primary",
  READ: "neutral",
  CLICKED: "warning",
  PURCHASED: "success",
};

const TimelinePage = () => {
  const { campaignId } = useParams<{ campaignId?: string }>();
  const [campaigns, setCampaigns] = useState<CampaignRecord[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(campaignId ?? null);
  const [campaign, setCampaign] = useState<CampaignRecord | null>(null);
  const [events, setEvents] = useState<CampaignTimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    const loadCampaigns = async () => {
      try {
        const data = await xenoApi.getCampaigns();
        if (!alive) {
          return;
        }

        setCampaigns(data);
        setSelectedCampaignId((current) => {
          if (current && data.some((item) => item.campaignId === current)) {
            return current;
          }

          return campaignId ?? data.find((item) => item.status === "RUNNING")?.campaignId ?? data[0]?.campaignId ?? null;
        });
        setError(null);
      } catch (loadError) {
        if (!alive) {
          return;
        }

        const message = loadError instanceof Error ? loadError.message : "Could not load the timeline workspace.";
        setError(message);
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    };

    void loadCampaigns();
    return () => {
      alive = false;
    };
  }, [campaignId]);

  useEffect(() => {
    if (!selectedCampaignId) {
      setCampaign(null);
      setEvents([]);
      return;
    }

    let alive = true;

    const loadTimeline = async () => {
      try {
        const [campaignData, eventData] = await Promise.all([
          xenoApi.getCampaignById(selectedCampaignId),
          xenoApi.getCampaignEvents(selectedCampaignId),
        ]);

        if (!alive) {
          return;
        }

        setCampaign(campaignData);
        setEvents(eventData);
      } catch {
        if (!alive) {
          return;
        }
      }
    };

    void loadTimeline();
    const timer = window.setInterval(() => {
      void loadTimeline();
    }, 2500);

    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, [selectedCampaignId]);

  const selected = campaign ?? campaigns.find((item) => item.campaignId === selectedCampaignId) ?? null;
  const eventCounts = events.reduce<Record<string, number>>((accumulator, event) => {
    accumulator[event.eventType] = (accumulator[event.eventType] ?? 0) + 1;
    return accumulator;
  }, {});

  return (
    <section className="space-y-5 pb-8">
      <Panel
        title="Communication timeline"
        eyebrow="Event stream"
        description="Follow the campaign from SENT to DELIVERED, OPENED, CLICKED, and PURCHASED. This is where the system design story becomes visible."
      >
        <div className="grid gap-3 md:grid-cols-4">
          <MetricCard label="Events" value={events.length} detail="All stored communication events for the selected campaign." />
          <MetricCard label="Delivered" value={eventCounts.DELIVERED ?? 0} detail="Messages confirmed by the channel service." />
          <MetricCard label="Clicked" value={eventCounts.CLICKED ?? 0} detail="People who engaged enough to click through." />
          <MetricCard label="Purchased" value={eventCounts.PURCHASED ?? 0} detail="Attributed conversions flowing back into the CRM." />
        </div>
      </Panel>

      <div className="grid gap-5 xl:grid-cols-[1fr_0.95fr]">
        <Panel title="Timeline view" eyebrow="Campaign selector" description="Choose a campaign and inspect the ordered stream of webhook callbacks.">
          <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
            <SelectField
              label="Campaign"
              value={selectedCampaignId ?? ""}
              onChange={(event) => setSelectedCampaignId(event.target.value || null)}
              options={[
                { label: "Pick a campaign", value: "" },
                ...campaigns.map((item) => ({
                  label: `${item.campaignId} - ${item.status}`,
                  value: item.campaignId,
                })),
              ]}
            />
            <div className="rounded-[26px] border border-white/8 bg-white/[0.04] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">System note</p>
              <p className="mt-2 text-sm leading-6 text-[var(--text-main)]">
                The channel service posts events back through the webhook API, and the CRM stores each transition with an idempotency key.
              </p>
            </div>
          </div>

          {error ? <p className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-50">{error}</p> : null}

          {loading ? <div className="mt-4 rounded-[26px] border border-white/8 bg-white/[0.04] p-5 text-sm text-[var(--text-muted)]">Loading timeline...</div> : null}

          <div className="mt-5 space-y-3">
            {events.map((event, index) => (
              <article key={`${event.communicationId}-${event.idempotencyKey}-${index}`} className="rounded-[28px] border border-white/8 bg-white/[0.04] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={eventTone[event.eventType]}>{labelEvent(event.eventType)}</Badge>
                      <Badge tone="neutral">{event.channel}</Badge>
                    </div>
                    <p className="text-sm font-semibold text-[var(--text-main)]">{event.customer.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {event.customer.customerCode} / {event.customer.city} / {event.customer.loyaltyTier}
                    </p>
                  </div>
                  <div className="text-right text-xs text-[var(--text-muted)]">
                    <p>{formatDateTime(event.timestamp)}</p>
                    <p>Seq {event.sequence}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--text-muted)]">
                  <span className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1">idempotency {event.idempotencyKey}</span>
                  <span className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1">{event.source}</span>
                  {event.amountImpact > 0 ? (
                    <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-emerald-100">
                      {formatCurrency(event.amountImpact)}
                    </span>
                  ) : null}
                </div>
              </article>
            ))}

            {!loading && events.length === 0 ? (
              <div className="rounded-[26px] border border-dashed border-white/12 bg-white/[0.03] p-5 text-sm text-[var(--text-muted)]">
                No events are stored for this campaign yet.
              </div>
            ) : null}
          </div>
        </Panel>

        <Panel
          title="Campaign summary"
          eyebrow="State transitions"
        description="The summary explains what happened after delivery, including the estimated revenue uplift and the recommendations the AI generated."
        >
          {selected ? (
            <div className="space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={statusTone[selected.status]}>{labelStatus(selected.status)}</Badge>
                    <Badge tone="neutral">{selected.recommendedChannel}</Badge>
                  </div>
                  <h3 className="text-2xl font-semibold text-[var(--text-main)]">{selected.objective}</h3>
                  <p className="text-sm text-[var(--text-muted)]">{selected.campaignId}</p>
                </div>
                <div className="rounded-[24px] border border-white/8 bg-white/[0.04] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">Audience</p>
                  <p className="mt-2 text-xl font-semibold text-[var(--text-main)]">{selected.audiencePreview.length}</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <MetricCard label="Sent" value={selected.metrics.sent} detail="Requests handed off to the channel service." />
                <MetricCard label="Delivered" value={selected.metrics.delivered} detail="Callbacks confirmed delivery into the CRM." />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[24px] border border-white/8 bg-white/[0.04] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">Timeline state</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-main)]">
                    {selected.status === "RUNNING"
                      ? "The campaign is still receiving webhook callbacks."
                      : selected.status === "COMPLETED"
                        ? "The campaign completed and the summary has been recomputed."
                        : "The campaign is in a transitional state."}
                  </p>
                </div>
                <div className="rounded-[24px] border border-white/8 bg-white/[0.04] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">Last update</p>
                  <p className="mt-2 text-sm font-semibold text-[var(--text-main)]">{formatDateTime(selected.updatedAt)}</p>
                </div>
              </div>

              {selected.summary ? (
                <div className="space-y-3 rounded-[28px] border border-emerald-400/15 bg-emerald-400/8 p-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-emerald-100/70">Audience reached</p>
                      <p className="mt-2 text-xl font-semibold text-[var(--text-main)]">{selected.summary.audienceReached}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-emerald-100/70">Open rate</p>
                      <p className="mt-2 text-xl font-semibold text-[var(--text-main)]">{formatPercent(selected.summary.openRate)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-emerald-100/70">Click rate</p>
                      <p className="mt-2 text-xl font-semibold text-[var(--text-main)]">{formatPercent(selected.summary.clickRate)}</p>
                    </div>
                  </div>
                  <p className="text-sm text-[var(--text-main)]">{formatCurrency(selected.summary.estimatedRevenueImpact)} estimated uplift</p>
                  <div className="space-y-2">
                    {selected.summary.recommendations.map((recommendation) => (
                      <div key={recommendation} className="rounded-2xl border border-white/8 bg-white/[0.05] px-4 py-3 text-sm leading-6 text-[var(--text-main)]">
                        {recommendation}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-[26px] border border-dashed border-white/12 bg-white/[0.03] p-5 text-sm text-[var(--text-muted)]">
                  This campaign has not finished yet, so the final AI summary is still waiting on the last callback.
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-[26px] border border-dashed border-white/12 bg-white/[0.03] p-5 text-sm text-[var(--text-muted)]">
              Select a campaign to inspect the callback stream and summary.
            </div>
          )}
        </Panel>
      </div>
    </section>
  );
};

export default TimelinePage;
