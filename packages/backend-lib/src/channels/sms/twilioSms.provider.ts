/**
 * Twilio SMS Provider Adapter
 *
 * Wraps the existing `sendSms` from `destinations/twilio.ts` behind
 * the unified ChannelProvider interface.
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
    SmsContent,
} from "../channelProvider";

export class TwilioSmsProvider implements ChannelProvider {
    readonly providerType = "Twilio";
    readonly channelType = "Sms";

    constructor(
        private readonly accountSid: string,
        private readonly auth: TwilioAuth,
        private readonly sender: Sender,
    ) { }

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

        const result = await sendSms({
            ...this.sender,
            body: content.body,
            to: message.to,
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
        return Boolean(config.accountSid && config.authToken);
    }
}
