/**
 * RCS (Rich Communication Services) Provider Adapter
 *
 * Implements RCS messaging with automatic SMS fallback when RCS
 * is unavailable for the recipient. Uses a provider-agnostic
 * abstraction layer that can be backed by Google Jibe, Twilio, or
 * other RCS aggregators.
 */
import { err, ok, Result } from "neverthrow";

import logger from "../../logger";
import {
    ChannelProvider,
    DeliveryError,
    DeliveryResult,
    OutboundMessage,
    RCSContent,
    SmsContent,
} from "../channelProvider";

export interface RCSProviderConfig {
    apiKey: string;
    agentId: string;
    baseUrl: string;
    smsFallbackProvider?: ChannelProvider;
}

export class RCSProvider implements ChannelProvider {
    readonly providerType = "RCS";
    readonly channelType = "RCS";

    constructor(private readonly config: RCSProviderConfig) { }

    async send(
        message: OutboundMessage,
    ): Promise<Result<DeliveryResult, DeliveryError>> {
        const content = message.content as RCSContent;
        if (content.type !== "rcs") {
            return err({
                provider: this.providerType,
                message: `Invalid content type: ${content.type}`,
                retryable: false,
            });
        }

        try {
            // Attempt RCS delivery
            const rcsPayload: Record<string, unknown> = {
                to: message.to,
                agentId: this.config.agentId,
                contentMessage: {
                    text: content.body,
                },
            };

            if (content.suggestions && content.suggestions.length > 0) {
                (rcsPayload.contentMessage as Record<string, unknown>).suggestions =
                    content.suggestions.map((s) => ({
                        reply: {
                            text: s.text,
                            postbackData: s.postbackData ?? s.text,
                        },
                    }));
            }

            if (content.mediaUrl) {
                (rcsPayload.contentMessage as Record<string, unknown>).contentInfo = {
                    fileUrl: content.mediaUrl,
                    forceRefresh: false,
                };
            }

            const response = await fetch(
                `${this.config.baseUrl}/v1/phones/${message.to}/agentMessages`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${this.config.apiKey}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(rcsPayload),
                },
            );

            if (!response.ok) {
                const errorBody = await response.text();
                logger().warn(
                    { status: response.status, body: errorBody },
                    "RCS delivery failed",
                );

                // If RCS fails and fallback is configured, try SMS
                if (content.fallbackToSms && this.config.smsFallbackProvider) {
                    logger().info(
                        { to: message.to },
                        "Falling back to SMS for RCS message",
                    );

                    const smsContent: SmsContent = {
                        type: "sms",
                        body: content.body,
                    };

                    return this.config.smsFallbackProvider.send({
                        ...message,
                        content: smsContent,
                    });
                }

                return err({
                    provider: this.providerType,
                    message: `RCS API error: ${response.status} ${errorBody}`,
                    retryable: response.status >= 500,
                    originalError: { status: response.status, body: errorBody },
                });
            }

            const responseData = (await response.json()) as {
                name?: string;
                messageId?: string;
            };

            logger().debug(
                { to: message.to, messageId: responseData.name },
                "RCS message sent",
            );

            return ok({
                messageId:
                    responseData.name ?? responseData.messageId ?? `rcs-${Date.now()}`,
                status: "sent" as const,
                provider: this.providerType,
                providerResponse: responseData,
            });
        } catch (e) {
            const error = e as Error;

            // On network error, attempt SMS fallback
            if (content.fallbackToSms && this.config.smsFallbackProvider) {
                logger().info(
                    { to: message.to, error: error.message },
                    "Falling back to SMS after RCS error",
                );

                const smsContent: SmsContent = {
                    type: "sms",
                    body: content.body,
                };

                return this.config.smsFallbackProvider.send({
                    ...message,
                    content: smsContent,
                });
            }

            return err({
                provider: this.providerType,
                message: error.message,
                retryable: true,
                originalError: error,
            });
        }
    }

    validateConfig(config: Record<string, unknown>): boolean {
        return Boolean(config.apiKey && config.agentId && config.baseUrl);
    }
}
