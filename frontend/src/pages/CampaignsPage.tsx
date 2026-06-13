import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import MetricCard from "../components/ui/MetricCard";
import Panel from "../components/ui/Panel";
import { formatCurrency, formatDateTime, formatPercent, labelStatus } from "../lib/format";
import { xenoApi } from "../lib/xenoApi";
import type { CampaignRecord, CampaignStatus } from "../types/xeno";

const statusFilters: Array<CampaignStatus | "all"> = ["all", "DRAFT", "PLANNED", "RUNNING", "COMPLETED", "FAILED"];

const statusTone: Record<CampaignStatus, "primary" | "success" | "warning" | "danger" | "neutral"> = {
  DRAFT: "neutral",
  PLANNED: "warning",
  RUNNING: "primary",
  COMPLETED: "success",
  FAILED: "danger",
};

const CampaignsPage = () => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<CampaignRecord[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<CampaignStatus | "all">("all");
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<"whatsapp" | "sms" | "email">("whatsapp");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    const loadCampaigns = async () => {
      try {
        setLoading(true);
        const campaignData = await xenoApi.getCampaigns();
        if (!alive) {
          return;
        }

        setCampaigns(campaignData);
        setSelectedCampaignId((current) => {
          if (current && campaignData.some((campaign) => campaign.campaignId === current)) {
            return current;
          }

          return campaignData[0]?.campaignId ?? null;
        });
        setError(null);
      } catch (loadError) {
        if (!alive) {
          return;
        }

        const message = loadError instanceof Error ? loadError.message : "Could not load campaigns.";
        setError(message);
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    };

    void loadCampaigns();

    const timer = window.setInterval(() => {
      void loadCampaigns();
    }, 6000);

    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, []);

  const filteredCampaigns = selectedStatus === "all" ? campaigns : campaigns.filter((campaign) => campaign.status === selectedStatus);
  const selectedCampaign = filteredCampaigns.find((campaign) => campaign.campaignId === selectedCampaignId) ?? campaigns.find((campaign) => campaign.campaignId === selectedCampaignId) ?? null;

  const activeCampaigns = campaigns.filter((campaign) => campaign.status === "RUNNING").length;
  const completedCampaigns = campaigns.filter((campaign) => campaign.status === "COMPLETED").length;
  const averageOpenRate =
    campaigns.length > 0 ? campaigns.reduce((sum, campaign) => sum + (campaign.summary?.openRate ?? 0), 0) / campaigns.length : 0;
  const totalProjectedRevenue = campaigns.reduce((sum, campaign) => sum + (campaign.summary?.estimatedRevenueImpact ?? 0), 0);

  return (
    <section className="space-y-5 pb-8">
      <Panel
        title="Campaign dashboard"
        eyebrow="Persistent objects"
        description="This view shows that the copilot creates real campaign records with status, metrics, and summaries."
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <MetricCard label="Campaigns" value={campaigns.length} detail="All campaigns stored in the workspace." />
          <MetricCard label="Running" value={activeCampaigns} detail="Campaigns currently waiting on the simulator." />
          <MetricCard label="Completed" value={completedCampaigns} detail="Campaigns that already received callbacks." />
          <MetricCard label="Projected revenue" value={formatCurrency(totalProjectedRevenue)} detail="Sum of campaign-level uplift estimates." />
          <MetricCard label="Avg open rate" value={formatPercent(averageOpenRate)} detail="Average open rate across campaigns with summaries." />
        </div>
      </Panel>

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel title="Campaign list" eyebrow="Filters" description="Filter by status to focus the review on running or completed campaigns.">
          <div className="flex flex-wrap gap-2">
            {statusFilters.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setSelectedStatus(status)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition duration-200 ${
                  selectedStatus === status
                    ? "border-[color:var(--primary)]/35 bg-[color:var(--primary)]/12 text-[var(--text-main)]"
                    : "border-white/8 bg-white/[0.03] text-[var(--text-muted)] hover:border-white/16 hover:bg-white/[0.06] hover:text-[var(--text-main)]"
                }`}
              >
                {status === "all" ? "All statuses" : labelStatus(status)}
              </button>
            ))}
          </div>

          {error ? <p className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-50">{error}</p> : null}

          <div className="mt-5 space-y-3">
            {loading ? (
              <div className="rounded-[26px] border border-white/8 bg-white/[0.04] p-5 text-sm text-[var(--text-muted)]">Loading campaigns...</div>
            ) : null}

            {filteredCampaigns.map((campaign) => (
              <button
                key={campaign.campaignId}
                type="button"
                onClick={() => setSelectedCampaignId(campaign.campaignId)}
                className={`w-full rounded-[28px] border p-4 text-left transition duration-200 ${
                  campaign.campaignId === selectedCampaignId
                    ? "border-[color:var(--primary)]/30 bg-[color:var(--primary)]/10"
                    : "border-white/8 bg-white/[0.04] hover:border-white/15 hover:bg-white/[0.06]"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={statusTone[campaign.status]}>{labelStatus(campaign.status)}</Badge>
                      <Badge tone="neutral">{campaign.recommendedChannel}</Badge>
                    </div>
                    <p className="text-sm font-semibold text-[var(--text-main)]">{campaign.objective}</p>
                    <p className="text-xs text-[var(--text-muted)]">{campaign.campaignId}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">Delivered</p>
                    <p className="mt-2 text-lg font-semibold text-[var(--text-main)]">{campaign.metrics.delivered}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)]">
                  <span>{campaign.audiencePreview.length} audience members</span>
                  <span>/</span>
                  <span>{campaign.summary ? formatPercent(campaign.summary.openRate) : "Open rate pending"}</span>
                  <span>/</span>
                  <span>{campaign.launchedAt ? formatDateTime(campaign.launchedAt) : "Not launched yet"}</span>
                </div>
              </button>
            ))}

            {!loading && filteredCampaigns.length === 0 ? (
              <div className="rounded-[26px] border border-dashed border-white/12 bg-white/[0.03] p-5 text-sm text-[var(--text-muted)]">
                No campaigns match this filter.
              </div>
            ) : null}
          </div>
        </Panel>

        <Panel
          title="Campaign details"
          eyebrow="AI output"
          description="A reviewer can inspect the campaign objective, the segment rules, the generated copy, and the resulting summary."
          actions={
            selectedCampaign ? (
              <Button type="button" variant="secondary" onClick={() => navigate(`/timeline/${selectedCampaign.campaignId}`)}>
                Open timeline
              </Button>
            ) : null
          }
        >
          {selectedCampaign ? (
            <div className="space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={statusTone[selectedCampaign.status]}>{labelStatus(selectedCampaign.status)}</Badge>
                    <Badge tone="neutral">{selectedCampaign.recommendedChannel}</Badge>
                  </div>
                  <h3 className="text-2xl font-semibold text-[var(--text-main)]">{selectedCampaign.objective}</h3>
                  <p className="text-sm text-[var(--text-muted)]">{selectedCampaign.campaignId}</p>
                </div>
                <div className="rounded-[24px] border border-white/8 bg-white/[0.04] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">Audience size</p>
                  <p className="mt-2 text-xl font-semibold text-[var(--text-main)]">{selectedCampaign.audiencePreview.length}</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[24px] border border-white/8 bg-white/[0.04] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">Audience definition</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-main)]">{selectedCampaign.audienceDefinition}</p>
                </div>
                <div className="rounded-[24px] border border-white/8 bg-white/[0.04] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">Segment rule</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-main)]">{selectedCampaign.audienceRuleText}</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <MetricCard label="Sent" value={selectedCampaign.metrics.sent} detail="Total send requests handed to the channel service." />
                <MetricCard label="Delivered" value={selectedCampaign.metrics.delivered} detail="Messages that arrived on the receiving channel." />
                <MetricCard label="Purchased" value={selectedCampaign.metrics.purchased} detail="Attributed conversions from the campaign." />
              </div>

              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">Message variants</p>
                <div className="flex flex-wrap gap-2">
                  {(["whatsapp", "sms", "email"] as const).map((variant) => (
                    <Button
                      key={variant}
                      type="button"
                      variant={selectedVariant === variant ? "primary" : "secondary"}
                      onClick={() => setSelectedVariant(variant)}
                    >
                      {variant === "whatsapp" ? "WhatsApp" : variant === "sms" ? "SMS" : "Email"}
                    </Button>
                  ))}
                </div>
                <div className="rounded-[26px] border border-white/8 bg-[linear-gradient(180deg,rgba(8,18,24,0.92),rgba(11,22,31,0.92))] p-4 text-sm leading-6 text-[var(--text-main)] whitespace-pre-line">
                  {selectedCampaign.messages[selectedVariant]}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[24px] border border-white/8 bg-white/[0.04] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">Reasoning</p>
                  <div className="mt-3 space-y-2">
                    {selectedCampaign.reasoning.map((reason) => (
                      <div key={reason} className="rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 text-sm leading-6 text-[var(--text-main)]">
                        {reason}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-[24px] border border-white/8 bg-white/[0.04] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">Summary</p>
                  {selectedCampaign.summary ? (
                    <div className="mt-3 space-y-2 text-sm leading-6 text-[var(--text-main)]">
                      <p>{formatPercent(selectedCampaign.summary.openRate)} open rate</p>
                      <p>{formatPercent(selectedCampaign.summary.clickRate)} click rate</p>
                      <p>{formatCurrency(selectedCampaign.summary.estimatedRevenueImpact)} estimated uplift</p>
                      {selectedCampaign.summary.recommendations.map((recommendation) => (
                        <div key={recommendation} className="rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3">
                          {recommendation}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">This campaign has not completed yet, so the AI summary is still waiting for the simulator callbacks.</p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">Audience preview</p>
                <div className="grid gap-3 md:grid-cols-2">
                  {selectedCampaign.audiencePreview.map((customer) => (
                    <div key={customer.customerId} className="rounded-[24px] border border-white/8 bg-white/[0.04] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-[var(--text-main)]">{customer.name}</p>
                          <p className="text-xs text-[var(--text-muted)]">{customer.email}</p>
                        </div>
                        <Badge tone="neutral">{customer.city}</Badge>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--text-muted)]">
                        <span>{customer.customerCode}</span>
                        <span>/</span>
                        <span>{customer.preferredChannel}</span>
                        <span>/</span>
                        <span>{customer.totalSpend} spend</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-[26px] border border-dashed border-white/12 bg-white/[0.03] p-5 text-sm text-[var(--text-muted)]">
              Select a campaign from the list to inspect its details.
            </div>
          )}
        </Panel>
      </div>
    </section>
  );
};

export default CampaignsPage;
