/**
 * Twilio WhatsApp Provider Adapter
 *
 * Uses Twilio's WhatsApp Business API to send messages.
 * Twilio WhatsApp uses the same SMS API with a `whatsapp:` prefix on phone numbers.
 */
import { err, ok, Result } from "neverthrow";

import {
    sendSms,
    Sender,
    TwilioAuth,
} from "../../destinations/twilio";
import { MessageTags } from "../../types";
import {
    ChannelProvider,
    DeliveryError,
    DeliveryResult,
    OutboundMessage,
    WhatsAppContent,
} from "../channelProvider";

export class TwilioWhatsAppProvider implements ChannelProvider {
    readonly providerType = "Twilio";
    readonly channelType = "WhatsApp";

    constructor(
        private readonly accountSid: string,
        private readonly auth: TwilioAuth,
        private readonly sender: Sender,
    ) { }

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

        // Twilio WhatsApp uses the same SMS endpoint but with whatsapp: prefix
        const to = message.to.startsWith("whatsapp:")
            ? message.to
            : `whatsapp:${message.to}`;

        // Build the sender with whatsapp: prefix
        const whatsAppSender: Sender =
            "from" in this.sender
                ? {
                    from: this.sender.from.startsWith("whatsapp:")
                        ? this.sender.from
                        : `whatsapp:${this.sender.from}`,
                }
                : this.sender;

        // Compose body from template or direct body
        const body = content.body ?? `Template: ${content.templateName}`;

        const result = await sendSms({
            ...whatsAppSender,
            body,
            to,
            workspaceId: message.workspaceId,
            userId: message.userId,
            accountSid: this.accountSid,
            auth: this.auth,
            subscriptionGroupId: message.tags?.subscriptionGroupId,
            tags: message.tags as MessageTags | undefined,
        });

        if (result.isErr()) {
            return err({
                provider: this.providerType,
                message: result.error.message,
                retryable: false,
                originalError: result.error,
            });
        }

        return ok({
            messageId: result.value.sid,
            status: "sent" as const,
            provider: this.providerType,
            providerResponse: result.value,
        });
    }

    validateConfig(config: Record<string, unknown>): boolean {
        return Boolean(config.accountSid && (config.authToken || config.apiKeySid));
    }
}
