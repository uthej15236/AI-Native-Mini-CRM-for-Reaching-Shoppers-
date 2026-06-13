export type Channel = "WhatsApp" | "SMS" | "Email";
export type CommunicationEventType = "SENT" | "DELIVERED" | "FAILED" | "OPENED" | "READ" | "CLICKED" | "PURCHASED";
export interface AudiencePreviewCustomer {
    customerId: string;
    customerCode: string;
    name: string;
    email: string;
    phone: string;
    preferredChannel: Channel;
    totalSpend: number;
    lastOrderDate: string;
    city: string;
}
export interface CampaignMessages {
    whatsapp: string;
    sms: string;
    email: string;
}
export interface SimulationRequest {
    campaignId: string;
    objective: string;
    recommendedChannel: Channel;
    audience: AudiencePreviewCustomer[];
    messages: CampaignMessages;
    callbackUrl: string;
    finishCallbackUrl: string;
    webhookSecret: string;
    idempotencyKey: string;
    speedFactor?: number;
}
export interface ChannelEventPayload {
    communicationId: string;
    campaignId: string;
    customerId: string;
    channel: Channel;
    eventType: CommunicationEventType;
    timestamp: string;
    idempotencyKey: string;
    sequence: number;
    amountImpact: number;
    source: "channel-service";
}
