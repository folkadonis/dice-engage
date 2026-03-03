import { Result } from "neverthrow";

// ─── Core Types ──────────────────────────────────────────────────────

export interface OutboundMessage {
    to: string;
    workspaceId: string;
    userId: string;
    templateId?: string;
    tags?: Record<string, string>;
    content: MessageContent;
}

export type MessageContent =
    | EmailContent
    | SmsContent
    | MobilePushContent
    | WebhookContent
    | WhatsAppContent
    | WebPushContent
    | RCSContent;

export interface EmailContent {
    type: "email";
    from: string;
    subject: string;
    body: string;
    replyTo?: string;
    headers?: Record<string, string>;
}

export interface SmsContent {
    type: "sms";
    body: string;
    from?: string;
}

export interface MobilePushContent {
    type: "mobilePush";
    title: string;
    body: string;
    imageUrl?: string;
    data?: Record<string, string>;
}

export interface WebhookContent {
    type: "webhook";
    url: string;
    method?: string;
    headers?: Record<string, string>;
    body?: string;
}

export interface WhatsAppContent {
    type: "whatsapp";
    templateName?: string;
    templateLanguage?: string;
    body?: string;
    mediaUrl?: string;
}

export interface WebPushContent {
    type: "webpush";
    title: string;
    body: string;
    icon?: string;
    url?: string;
    badge?: string;
}

export interface RCSContent {
    type: "rcs";
    body: string;
    suggestions?: Array<{ text: string; postbackData?: string }>;
    mediaUrl?: string;
    fallbackToSms?: boolean;
}

// ─── Result Types ────────────────────────────────────────────────────

export interface DeliveryResult {
    messageId: string;
    status: "sent" | "queued" | "failed";
    provider: string;
    providerResponse?: unknown;
}

export interface DeliveryError {
    provider: string;
    message: string;
    retryable: boolean;
    originalError?: unknown;
}

export interface MessageStatus {
    messageId: string;
    status: "sent" | "delivered" | "failed" | "read" | "bounced" | "unknown";
    timestamp: Date;
    metadata?: Record<string, unknown>;
}

// ─── Channel Provider Interface ──────────────────────────────────────

/**
 * Unified interface that all channel providers must implement.
 * Wraps existing provider implementations (Twilio, SES, FCM, etc.)
 * behind a consistent contract.
 */
export interface ChannelProvider {
    /** Unique identifier for this provider, e.g. "Twilio", "AmazonSes" */
    readonly providerType: string;

    /** Channel this provider handles, e.g. "Email", "Sms" */
    readonly channelType: string;

    /** Send a message through this provider */
    send(message: OutboundMessage): Promise<Result<DeliveryResult, DeliveryError>>;

    /** Validate that the given configuration is valid for this provider */
    validateConfig(config: Record<string, unknown>): boolean;

    /** Optionally check the status of a previously sent message */
    getStatus?(messageId: string): Promise<MessageStatus>;
}
