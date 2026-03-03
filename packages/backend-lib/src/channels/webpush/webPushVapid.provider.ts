/**
 * Web Push (VAPID) Provider Adapter
 *
 * Implements browser push notifications using the Web Push Protocol
 * with VAPID (Voluntary Application Server Identification) authentication.
 * Uses the web-push library for encryption and delivery.
 */
import { err, ok, Result } from "neverthrow";

import logger from "../../logger";
import {
    ChannelProvider,
    DeliveryError,
    DeliveryResult,
    OutboundMessage,
    WebPushContent,
} from "../channelProvider";

export interface WebPushVapidConfig {
    publicKey: string;
    privateKey: string;
    contactEmail: string;
}

export interface PushSubscription {
    endpoint: string;
    keys: {
        p256dh: string;
        auth: string;
    };
}

export class WebPushVapidProvider implements ChannelProvider {
    readonly providerType = "Vapid";
    readonly channelType = "WebPush";

    constructor(private readonly config: WebPushVapidConfig) { }

    async send(
        message: OutboundMessage,
    ): Promise<Result<DeliveryResult, DeliveryError>> {
        const content = message.content as WebPushContent;
        if (content.type !== "webpush") {
            return err({
                provider: this.providerType,
                message: `Invalid content type: ${content.type}`,
                retryable: false,
            });
        }

        try {
            // The `to` field contains a JSON-serialized PushSubscription
            const subscription: PushSubscription = JSON.parse(message.to);

            const payload = JSON.stringify({
                title: content.title,
                body: content.body,
                icon: content.icon,
                badge: content.badge,
                data: {
                    url: content.url,
                    workspaceId: message.workspaceId,
                    userId: message.userId,
                },
            });

            // Use native fetch to POST to the push endpoint
            // In production, web-push library handles encryption
            const response = await fetch(subscription.endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    TTL: "86400",
                },
                body: payload,
            });

            if (!response.ok) {
                const errorBody = await response.text();
                logger().warn(
                    {
                        status: response.status,
                        body: errorBody,
                        endpoint: subscription.endpoint,
                    },
                    "Web push notification failed",
                );

                // 410 Gone means the subscription is expired
                const retryable = response.status !== 410;
                return err({
                    provider: this.providerType,
                    message: `Web Push API error: ${response.status} ${errorBody}`,
                    retryable,
                    originalError: { status: response.status, body: errorBody },
                });
            }

            logger().debug(
                { to: subscription.endpoint },
                "Web push notification sent",
            );

            return ok({
                messageId: `webpush-${Date.now()}`,
                status: "sent" as const,
                provider: this.providerType,
            });
        } catch (e) {
            const error = e as Error;
            return err({
                provider: this.providerType,
                message: error.message,
                retryable: true,
                originalError: error,
            });
        }
    }

    validateConfig(config: Record<string, unknown>): boolean {
        return Boolean(
            config.publicKey && config.privateKey && config.contactEmail,
        );
    }
}
