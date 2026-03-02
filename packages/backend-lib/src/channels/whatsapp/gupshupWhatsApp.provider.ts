/**
 * Gupshup WhatsApp Provider Adapter
 *
 * Uses Gupshup's WhatsApp Business API to send template and session messages.
 * Supports both pre-approved HSM templates and free-form session messages.
 */
import { err, ok, Result } from "neverthrow";

import logger from "../../logger";
import {
    ChannelProvider,
    DeliveryError,
    DeliveryResult,
    OutboundMessage,
    WhatsAppContent,
} from "../channelProvider";

export interface GupshupWhatsAppConfig {
    apiKey: string;
    appName: string;
    sourceNumber: string;
}

export class GupshupWhatsAppProvider implements ChannelProvider {
    readonly providerType = "Gupshup";
    readonly channelType = "WhatsApp";

    constructor(private readonly config: GupshupWhatsAppConfig) { }

    async send(
        message: OutboundMessage,
    ): Promise<Result<DeliveryResult, DeliveryError>> {
        const content = message.content as WhatsAppContent;
        if (content.type !== "whatsapp") {
            return err({
                provider: this.providerType,
                message: `Invalid content type: ${content.type}`,
                retryable: false,
            });
        }

        try {
            const isTemplate = Boolean(content.templateName);

            const payload: Record<string, string> = {
                channel: "whatsapp",
                source: this.config.sourceNumber,
                destination: message.to,
                "src.name": this.config.appName,
            };

            if (isTemplate) {
                // HSM (Highly Structured Message) template message
                payload.message = JSON.stringify({
                    type: "text",
                    text: content.body ?? "",
                });
                payload["template"] = JSON.stringify({
                    id: content.templateName,
                    params: [],
                });
            } else {
                // Session message (free-form text)
                if (content.mediaUrl) {
                    payload.message = JSON.stringify({
                        type: "image",
                        originalUrl: content.mediaUrl,
                        caption: content.body ?? "",
                    });
                } else {
                    payload.message = JSON.stringify({
                        type: "text",
                        text: content.body ?? "",
                    });
                }
            }

            const response = await fetch(
                "https://api.gupshup.io/wa/api/v1/msg",
                {
                    method: "POST",
                    headers: {
                        apikey: this.config.apiKey,
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                    body: new URLSearchParams(payload).toString(),
                },
            );

            const responseData = (await response.json()) as {
                status: string;
                messageId?: string;
                message?: string;
            };

            logger().debug(
                {
                    response: responseData,
                    to: message.to,
                    template: content.templateName,
                },
                "Gupshup WhatsApp message sent",
            );

            if (responseData.status !== "submitted") {
                return err({
                    provider: this.providerType,
                    message: `Gupshup API error: ${responseData.message ?? JSON.stringify(responseData)}`,
                    retryable: true,
                    originalError: responseData,
                });
            }

            return ok({
                messageId: responseData.messageId ?? `gupshup-wa-${Date.now()}`,
                status: "sent" as const,
                provider: this.providerType,
                providerResponse: responseData,
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
        return Boolean(config.apiKey && config.appName && config.sourceNumber);
    }
}
