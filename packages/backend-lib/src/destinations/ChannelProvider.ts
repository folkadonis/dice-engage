import { Result, ResultAsync } from "neverthrow";

import { MessageTags } from "../types";

export interface SendMessageParams {
    workspaceId: string;
    userId: string;
    subscriptionGroupId?: string;
    to: string;
    body: string;
    tags?: MessageTags;
    tenantId?: string; // Multi-tenant support
    channel?: string;
    provider?: string;
    config: unknown; // Provider specific configuration
}

export interface SendMessageResult {
    messageId: string;
    status: "sent" | "failed" | "queued";
}

export interface WebhookProcessParams {
    workspaceId: string;
    body: unknown;
    headers: Record<string, string>;
    tenantId?: string;
}

export interface ChannelProvider {
    /**
     * The identifier for this provider (e.g. "twilio", "sendgrid").
     */
    name: string;

    /**
     * Send a message through this provider.
     */
    sendMessage(params: SendMessageParams): Promise<Result<SendMessageResult, Error>>;

    /**
     * Process an incoming webhook from this provider and dispatch internal tracking events.
     */
    processWebhook?(params: WebhookProcessParams): ResultAsync<void, Error>;
}
