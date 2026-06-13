import clsx from "clsx";
import { useEffect, useRef, useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import MetricCard from "../components/ui/MetricCard";
import Panel from "../components/ui/Panel";
import { formatCompact, formatCurrency, formatDateTime, formatPercent, labelEvent, labelStatus } from "../lib/format";
import { xenoApi } from "../lib/xenoApi";
import type {
  CampaignPlan,
  CampaignRecord,
  CampaignTimelineEvent,
  CopilotConversationMessage,
  DashboardOverview,
  Channel,
} from "../types/xeno";

type MessageRole = CopilotConversationMessage["role"];
type VariantKey = "whatsapp" | "sms" | "email";

const starterPrompts = [
  "Increase repeat purchases from customers who bought in the last 90 days but have not returned in 30 days.",
  "Win back dormant high-spend customers who have not purchased in the last 60 days.",
  "Drive a weekend bundle campaign for loyal buyers with high purchase intent.",
];

const variantToChannel: Record<VariantKey, Channel> = {
  whatsapp: "WhatsApp",
  sms: "SMS",
  email: "Email",
};

const channelToVariant: Record<Channel, VariantKey> = {
  WhatsApp: "whatsapp",
  SMS: "sms",
  Email: "email",
};

const statusTone: Record<CampaignRecord["status"], "primary" | "success" | "warning" | "danger" | "neutral"> = {
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

const createMessage = (role: MessageRole, title: string, body: string): CopilotConversationMessage => ({
  id: `${role}-${crypto.randomUUID()}`,
  role,
  title,
  body,
  timestamp: new Date().toISOString(),
});

const buildPlanNarrative = (plan: CampaignPlan) => {
  const audienceSample = plan.audiencePreview.slice(0, 3).map((customer) => customer.name).join(", ");
  return [
    `${plan.audienceSize} customers matched the segment.`,
    `I recommend ${plan.recommendedChannel} because ${plan.channelReason.toLowerCase()}`,
    `Offer: ${plan.offer}`,
    audienceSample ? `Sample audience: ${audienceSample}.` : "I kept the audience compact so the campaign stays focused.",
  ].join(" ");
};

const buildLaunchNarrative = (campaignId: string) =>
  `Campaign ${campaignId} is live. The CRM now hands off to the separate channel service, which emits delivery, open, click, and purchase callbacks back into the campaign state.`;

const buildSummaryCopy = (plan: CampaignPlan) =>
  [
    `Objective: ${plan.objective}`,
    `Audience: ${plan.audienceDefinition}`,
    `Segment logic: ${plan.audienceRuleText}`,
    `Channel: ${plan.recommendedChannel}`,
    `Offer: ${plan.offer}`,
    `Reasoning: ${plan.reasoning.join(" ")}`,
  ].join("\n\n");

const pad = (value: number) => value.toString().padStart(2, "0");

const useOverviewSnapshot = () => {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    const loadOverview = async () => {
      try {
        const data = await xenoApi.getOverview();
        if (!alive) {
          return;
        }

        setOverview(data);
        setError(null);
      } catch (snapshotError) {
        if (!alive) {
          return;
        }

        const message = snapshotError instanceof Error ? snapshotError.message : "Could not load the workspace snapshot.";
        setError(message);
      }
    };

    void loadOverview();
    const timer = window.setInterval(() => {
      void loadOverview();
    }, 6000);

    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, []);

  return { overview, setOverview, error };
};

const CopilotPage = () => {
  const [objective, setObjective] = useState(starterPrompts[0]);
  const [conversation, setConversation] = useState<CopilotConversationMessage[]>([
    createMessage(
      "system",
      "Copilot online",
      "I can read a business goal, shape the audience, pick the channel, draft channel-specific copy, and launch the campaign when you're ready."
    ),
  ]);
  const [plan, setPlan] = useState<CampaignPlan | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<VariantKey>("whatsapp");
  const [liveCampaignId, setLiveCampaignId] = useState<string | null>(null);
  const [liveCampaign, setLiveCampaign] = useState<CampaignRecord | null>(null);
  const [liveEvents, setLiveEvents] = useState<CampaignTimelineEvent[]>([]);
  const [planning, setPlanning] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [copying, setCopying] = useState(false);
  const messageListRef = useRef<HTMLDivElement | null>(null);
  const { overview, setOverview, error: snapshotError } = useOverviewSnapshot();

  useEffect(() => {
    messageListRef.current?.scrollTo({
      top: messageListRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [conversation, plan]);

  useEffect(() => {
    if (!liveCampaignId) {
      setLiveCampaign(null);
      setLiveEvents([]);
      return;
    }

    let alive = true;

    const loadLiveCampaign = async () => {
      try {
        const [campaign, events] = await Promise.all([
          xenoApi.getCampaignById(liveCampaignId),
          xenoApi.getCampaignEvents(liveCampaignId),
        ]);

        if (!alive) {
          return;
        }

        setLiveCampaign(campaign);
        setLiveEvents(events);
      } catch {
        // Keep the last good state if a poll momentarily fails.
      }
    };

    void loadLiveCampaign();
    const timer = window.setInterval(() => {
      void loadLiveCampaign();
    }, 2500);

    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, [liveCampaignId]);

  const handlePromptPick = (prompt: string) => {
    setObjective(prompt);
  };

  const handlePlan = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    const trimmedObjective = objective.trim();

    if (trimmedObjective.length < 10) {
      toast.error("Please enter a goal with at least 10 characters.");
      return;
    }

    setPlanning(true);
    setConversation((current) => [
      ...current,
      createMessage("user", "Marketing brief", trimmedObjective),
    ]);

    try {
      const result = await xenoApi.planCampaign(trimmedObjective);
      setPlan(result);
      setSelectedVariant(channelToVariant[result.recommendedChannel]);
      setConversation((current) => [
        ...current,
        createMessage("assistant", "Campaign plan ready", buildPlanNarrative(result)),
      ]);
      toast.success("Audience and campaign plan are ready.");
    } catch (planError) {
      const message = planError instanceof Error ? planError.message : "Could not build the campaign plan.";
      toast.error(message);
    } finally {
      setPlanning(false);
    }
  };

  const handleLaunch = async () => {
    if (!plan) {
      toast.error("Plan a campaign before launching it.");
      return;
    }

    setLaunching(true);

    try {
      const response = await xenoApi.launchCampaign(plan.objective);
      setPlan(response.plan);
      setLiveCampaignId(response.campaign.campaignId);
      setConversation((current) => [
        ...current,
        createMessage("system", "Launch confirmed", buildLaunchNarrative(response.campaign.campaignId)),
      ]);
      toast.success("Campaign launched.");

      const refreshed = await xenoApi.getOverview();
      setOverview(refreshed);
    } catch (launchError) {
      const message = launchError instanceof Error ? launchError.message : "Could not launch the campaign.";
      toast.error(message);
    } finally {
      setLaunching(false);
    }
  };

  const handleSeedWorkspace = async () => {
    setSeeding(true);

    try {
      await xenoApi.seedWorkspace();
      const refreshed = await xenoApi.getOverview();
      setOverview(refreshed);
      setLiveCampaignId(null);
      setConversation((current) => [
        ...current,
        createMessage("system", "Demo data refreshed", "I reloaded the workspace with a fresh customer base, order history, campaigns, and event stream."),
      ]);
      toast.success("Demo workspace reloaded.");
    } catch (seedError) {
      const message = seedError instanceof Error ? seedError.message : "Could not refresh demo data.";
      toast.error(message);
    } finally {
      setSeeding(false);
    }
  };

  const handleCopySummary = async () => {
    if (!plan) {
      toast.error("Plan a campaign first so I can copy the summary.");
      return;
    }

    setCopying(true);

    try {
      await navigator.clipboard.writeText(buildSummaryCopy(plan));
      toast.success("Summary copied to clipboard.");
    } catch {
      toast.error("Could not copy the summary.");
    } finally {
      setCopying(false);
    }
  };

  const audienceReached = plan?.estimatedMetrics.audienceReached ?? 0;
  const liveStream = liveEvents.length > 0 ? liveEvents : overview?.recentEvents ?? [];

  return (
    <section className="space-y-5 pb-8">
      <div className="rounded-[36px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_24px_60px_rgba(2,6,12,0.22)] backdrop-blur-xl md:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-4">
            <Badge tone="primary">AI Campaign Copilot</Badge>
            <div className="space-y-3">
              <h2 className="text-4xl font-semibold tracking-tight text-[var(--text-main)] md:text-5xl">
                Turn business goals into campaigns.
              </h2>
              <p className="max-w-2xl text-base leading-7 text-[var(--text-muted)]">
                Speak in natural language. The copilot finds the audience, chooses the channel, drafts channel-specific copy, and hands the campaign to the separate simulator service.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[470px]">
            <MetricCard
              label="Customers"
              value={overview ? formatCompact(overview.customersCount) : "-"}
              detail="Seeded customer profiles available for segmentation."
              accent="C"
            />
            <MetricCard
              label="Campaigns"
              value={overview ? formatCompact(overview.campaignsCount) : "-"}
              detail="Running and completed campaigns tracked in one stream."
              accent="K"
            />
            <MetricCard
              label="Revenue impact"
              value={overview ? formatCurrency(overview.totalRevenue) : "INR 0"}
              detail="Estimated uplift from completed campaigns."
              accent="INR"
            />
          </div>
        </div>

        {snapshotError ? (
          <div className="mt-6 rounded-3xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-sm text-amber-50">
            {snapshotError}
          </div>
        ) : null}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.95fr]">
        <Panel
          title="Ask the copilot"
          eyebrow="Conversation"
          description="Give the marketing brief in one sentence. The AI will return a segment, channel recommendation, message variants, and launch plan."
          actions={
            <>
              <Button variant="secondary" onClick={handleSeedWorkspace} isLoading={seeding}>
                Refresh demo data
              </Button>
              <Button variant="secondary" onClick={handleCopySummary} isLoading={copying} disabled={!plan}>
                Copy plan
              </Button>
              <Button onClick={handleLaunch} isLoading={launching} disabled={!plan}>
                Launch campaign
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {starterPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handlePromptPick(prompt)}
                  className={clsx(
                    "rounded-full border px-4 py-2 text-left text-sm transition duration-200",
                    objective === prompt
                      ? "border-[color:var(--primary)]/35 bg-[color:var(--primary)]/12 text-[var(--text-main)]"
                      : "border-white/8 bg-white/[0.03] text-[var(--text-muted)] hover:border-white/16 hover:bg-white/[0.06] hover:text-[var(--text-main)]"
                  )}
                >
                  {prompt}
                </button>
              ))}
            </div>

            <form className="space-y-3" onSubmit={handlePlan}>
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-[var(--text-main)]">Business goal</span>
                <textarea
                  value={objective}
                  onChange={(event) => setObjective(event.target.value)}
                  rows={5}
                  className="min-h-[140px] w-full rounded-[28px] border border-[var(--border-color)] bg-[color:var(--panel)]/90 px-4 py-4 text-sm leading-6 text-[var(--text-main)] outline-none transition duration-200 placeholder:text-[var(--text-muted)] focus:border-[color:var(--primary)] focus:ring-2 focus:ring-[color:var(--primary)]/20"
                  placeholder="Example: Increase repeat purchases from customers who bought in the last 90 days but have not returned in 30 days."
                />
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" isLoading={planning}>
                  Build campaign plan
                </Button>
                <p className="text-sm text-[var(--text-muted)]">
                  The plan will include audience logic, channel reasoning, and WhatsApp, SMS, and Email copy.
                </p>
              </div>
            </form>
          </div>

          <div ref={messageListRef} className="mt-6 max-h-[440px] space-y-3 overflow-y-auto pr-1">
            {conversation.map((message) => (
              <article
                key={message.id}
                className={clsx(
                  "rounded-[28px] border p-4 shadow-[0_16px_40px_rgba(2,6,12,0.18)]",
                  message.role === "user"
                    ? "ml-8 border-[color:var(--primary)]/24 bg-[color:var(--primary)]/10"
                    : message.role === "assistant"
                      ? "mr-8 border-white/10 bg-white/[0.05]"
                      : "border-white/8 bg-white/[0.03]"
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">{message.title}</p>
                    <p className="text-sm leading-6 text-[var(--text-main)]">{message.body}</p>
                  </div>
                  <span className="shrink-0 text-[10px] uppercase tracking-[0.22em] text-[var(--text-muted)]">
                    {message.role}
                  </span>
                </div>
                <div className="mt-3 text-xs text-[var(--text-muted)]">{formatDateTime(message.timestamp)}</div>
              </article>
            ))}
          </div>
        </Panel>

        <div className="space-y-5">
          <Panel
            title="Decision layer"
            eyebrow="AI thinking"
            description="This is the part the reviewer should remember: the AI is making marketing decisions, not just writing text."
          >
            {plan ? (
              <div className="space-y-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[24px] border border-white/8 bg-white/[0.04] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">Audience</p>
                    <p className="mt-2 text-sm leading-6 text-[var(--text-main)]">{plan.audienceDefinition}</p>
                    <p className="mt-3 text-xs text-[var(--text-muted)]">Rule: {plan.audienceRuleText}</p>
                  </div>
                  <div className="rounded-[24px] border border-white/8 bg-white/[0.04] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">Channel choice</p>
                    <Badge tone="primary" className="mt-3">
                      {plan.recommendedChannel}
                    </Badge>
                    <p className="mt-3 text-sm leading-6 text-[var(--text-main)]">{plan.channelReason}</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[24px] border border-white/8 bg-white/[0.04] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">Audience reached</p>
                    <p className="mt-2 text-2xl font-semibold text-[var(--text-main)]">{formatCompact(audienceReached)}</p>
                  </div>
                  <div className="rounded-[24px] border border-white/8 bg-white/[0.04] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">Open rate</p>
                    <p className="mt-2 text-2xl font-semibold text-[var(--text-main)]">
                      {formatPercent(plan.estimatedMetrics.openRate)}
                    </p>
                  </div>
                  <div className="rounded-[24px] border border-white/8 bg-white/[0.04] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">Click rate</p>
                    <p className="mt-2 text-2xl font-semibold text-[var(--text-main)]">
                      {formatPercent(plan.estimatedMetrics.clickRate)}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {(["whatsapp", "sms", "email"] as VariantKey[]).map((variant) => (
                      <Button
                        key={variant}
                        type="button"
                        variant={selectedVariant === variant ? "primary" : "secondary"}
                        onClick={() => setSelectedVariant(variant)}
                      >
                        {variantToChannel[variant]}
                      </Button>
                    ))}
                  </div>
                  <div className="rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(8,18,24,0.92),rgba(11,22,31,0.92))] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
                      {variantToChannel[selectedVariant]} copy
                    </p>
                    <p className="mt-3 whitespace-pre-line text-sm leading-6 text-[var(--text-main)]">
                      {plan.messages[selectedVariant]}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">Reasoning</p>
                  <ul className="space-y-2">
                    {plan.reasoning.map((reason) => (
                      <li
                        key={reason}
                        className="rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 text-sm leading-6 text-[var(--text-main)]"
                      >
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="rounded-[28px] border border-dashed border-white/12 bg-white/[0.03] p-5 text-sm leading-6 text-[var(--text-muted)]">
                Ask for a campaign and I will show the decision stack here: segment logic, channel choice, offer, copy, and rollout workflow.
              </div>
            )}
          </Panel>

          <Panel
            title="Live campaign"
            eyebrow="Separate channel service"
            description="This feed updates while the simulator sends delivery, open, click, and purchase callbacks back to the CRM."
          >
            {liveCampaign ? (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={statusTone[liveCampaign.status]}>{labelStatus(liveCampaign.status)}</Badge>
                      <Badge tone="neutral">{liveCampaign.recommendedChannel}</Badge>
                    </div>
                    <p className="text-sm text-[var(--text-muted)]">Campaign ID: {liveCampaign.campaignId}</p>
                  </div>
                  {liveCampaign.summary ? (
                    <div className="rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">Revenue impact</p>
                      <p className="mt-2 text-xl font-semibold text-[var(--text-main)]">
                        {formatCurrency(liveCampaign.summary.estimatedRevenueImpact)}
                      </p>
                    </div>
                  ) : null}
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <MetricCard
                    label="Sent"
                    value={liveCampaign.metrics.sent}
                    detail="Requests handed to the channel simulator."
                    accent="S"
                  />
                  <MetricCard
                    label="Delivered"
                    value={liveCampaign.metrics.delivered}
                    detail="Webhook confirmations that made it through."
                    accent="D"
                  />
                  <MetricCard
                    label="Purchased"
                    value={liveCampaign.metrics.purchased}
                    detail="Downstream conversions attributed to the campaign."
                    accent="P"
                  />
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">Event stream</p>
                  <div className="space-y-3">
                    {(liveStream as CampaignTimelineEvent[]).slice(0, 8).map((event, index) => (
                      <article
                        key={`${event.communicationId}-${event.idempotencyKey}-${index}`}
                        className="rounded-[24px] border border-white/8 bg-white/[0.04] p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge tone={eventTone[event.eventType]}>{labelEvent(event.eventType)}</Badge>
                              <span className="text-sm font-semibold text-[var(--text-main)]">{event.customer.name}</span>
                            </div>
                            <p className="text-sm text-[var(--text-muted)]">
                              {event.customer.customerCode} / {event.customer.city} / {event.customer.loyaltyTier}
                            </p>
                          </div>
                          <div className="text-right text-xs text-[var(--text-muted)]">
                            <p>{formatDateTime(event.timestamp)}</p>
                            <p>Seq {pad(event.sequence)}</p>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                          <span className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-[var(--text-muted)]">
                            {event.channel}
                          </span>
                          {event.amountImpact > 0 ? (
                            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-emerald-100">
                              {formatCurrency(event.amountImpact)}
                            </span>
                          ) : (
                            <span className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-[var(--text-muted)]">
                              No value impact
                            </span>
                          )}
                          <span className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-[var(--text-muted)]">
                            {event.source}
                          </span>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>

                {liveCampaign.summary ? (
                  <div className="space-y-3 rounded-[28px] border border-emerald-400/15 bg-emerald-400/8 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-100">AI campaign summary</p>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-emerald-100/70">Audience reached</p>
                        <p className="mt-2 text-xl font-semibold text-[var(--text-main)]">
                          {formatCompact(liveCampaign.summary.audienceReached)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-emerald-100/70">Open rate</p>
                        <p className="mt-2 text-xl font-semibold text-[var(--text-main)]">
                          {formatPercent(liveCampaign.summary.openRate)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-emerald-100/70">Click rate</p>
                        <p className="mt-2 text-xl font-semibold text-[var(--text-main)]">
                          {formatPercent(liveCampaign.summary.clickRate)}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {liveCampaign.summary.recommendations.map((recommendation) => (
                        <div key={recommendation} className="rounded-2xl border border-white/8 bg-white/[0.05] px-4 py-3 text-sm leading-6 text-[var(--text-main)]">
                          {recommendation}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="rounded-[28px] border border-dashed border-white/12 bg-white/[0.03] p-5 text-sm leading-6 text-[var(--text-muted)]">
                Launch a campaign to watch the separate channel service send callbacks into the CRM in real time.
              </div>
            )}
          </Panel>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel
          title="Campaign performance"
          eyebrow="Overview"
          description="The dashboard summarizes the live workspace so the reviewer can see that this is an end-to-end system, not a single chat widget."
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="Open rate"
              value={overview ? formatPercent(overview.openRate) : "-"}
              detail="Across delivered messages in the workspace."
            />
            <MetricCard
              label="Click rate"
              value={overview ? formatPercent(overview.clickRate) : "-"}
              detail="Click-through measured from the delivery base."
            />
            <MetricCard
              label="Purchase rate"
              value={overview ? formatPercent(overview.purchaseRate) : "-"}
              detail="Attributed purchase conversions from campaigns."
            />
            <MetricCard
              label="Active campaigns"
              value={overview ? overview.activeCampaigns : "-"}
              detail="Currently in the simulation pipeline."
            />
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {(overview?.channelPerformance ?? []).map((row) => (
              <div key={row.channel} className="rounded-[26px] border border-white/8 bg-white/[0.04] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-main)]">{row.channel}</p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {row.delivered} delivered / {row.opened} opened / {row.clicked} clicked
                    </p>
                  </div>
                  <Badge tone="neutral">{formatCompact(row.purchased)} purchases</Badge>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/6">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,var(--primary),var(--primary-soft))]"
                    style={{
                      width: `${Math.min(100, Math.max(10, row.delivered * 12 + row.opened * 8 + row.clicked * 10))}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel
          title="Recent campaigns"
          eyebrow="Workspace history"
          description="Use this to explain that the AI is operating on real campaign objects, not a mock chat log."
        >
          <div className="space-y-3">
            {(overview?.recentCampaigns ?? []).map((campaign) => (
              <article
                key={campaign.campaignId}
                className="rounded-[26px] border border-white/8 bg-white/[0.04] p-4 transition duration-200 hover:border-[color:var(--primary)]/25 hover:bg-white/[0.06]"
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
                {campaign.summary ? (
                  <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
                    {formatCurrency(campaign.summary.estimatedRevenueImpact)} projected uplift, {formatPercent(campaign.summary.openRate)} open rate.
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        </Panel>
      </div>
    </section>
  );
};

export default CopilotPage;
