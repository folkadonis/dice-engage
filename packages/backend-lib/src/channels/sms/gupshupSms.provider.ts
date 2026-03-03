/**
 * Gupshup SMS Provider
 *
 * New provider for sending SMS via the Gupshup Enterprise API.
 * Supports DLT compliance for India regulations.
 */
import { err, ok, Result } from "neverthrow";

import logger from "../../logger";
import {
    ChannelProvider,
    DeliveryError,
    DeliveryResult,
    OutboundMessage,
    SmsContent,
} from "../channelProvider";

export interface GupshupSmsConfig {
    apiKey: string;
    appName: string;
    senderId?: string;
    dltTemplateId?: string;
    dltEntityId?: string;
}

export class GupshupSmsProvider implements ChannelProvider {
    readonly providerType = "Gupshup";
    readonly channelType = "Sms";

    constructor(private readonly config: GupshupSmsConfig) { }

    async send(
        message: OutboundMessage,
    ): Promise<Result<DeliveryResult, DeliveryError>> {
        const content = message.content as SmsContent;
        if (content.type !== "sms") {
            return err({
                provider: this.providerType,
                message: `Invalid content type: ${content.type}`,
                retryable: false,
            });
        }

        try {
            const params = new URLSearchParams({
                method: "SendMessage",
                send_to: message.to,
                msg: content.body,
                msg_type: "TEXT",
                userid: this.config.appName,
                auth_scheme: "plain",
                password: this.config.apiKey,
                v: "1.1",
                format: "json",
            });

            if (this.config.senderId) {
                params.set("mask", this.config.senderId);
            }
            if (this.config.dltTemplateId) {
                params.set("dltTemplateId", this.config.dltTemplateId);
            }
            if (this.config.dltEntityId) {
                params.set("dltEntityId", this.config.dltEntityId);
            }

            const response = await fetch(
                `https://enterprise.smsgupshup.com/GatewayAPI/rest?${params.toString()}`,
                { method: "GET" },
            );

            const responseText = await response.text();
            logger().debug(
                { response: responseText, to: message.to },
                "Gupshup SMS sent",
            );

            // Gupshup returns pipe-delimited responses: "success | <txnId> | <msgId>"
            const parts = responseText.split("|").map((p) => p.trim());
            const success = parts[0]?.toLowerCase() === "success";

            if (!success) {
                return err({
                    provider: this.providerType,
                    message: `Gupshup API error: ${responseText}`,
                    retryable: true,
                    originalError: responseText,
                });
            }

            return ok({
                messageId: parts[2] ?? `gupshup-${Date.now()}`,
                status: "sent" as const,
                provider: this.providerType,
                providerResponse: responseText,
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
        return Boolean(config.apiKey && config.appName);
    }
}
