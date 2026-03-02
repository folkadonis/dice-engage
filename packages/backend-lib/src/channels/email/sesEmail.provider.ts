/**
 * Amazon SES Email Provider Adapter
 *
 * Wraps the existing `sendMail` from `destinations/amazonses.ts`
 * behind the unified ChannelProvider interface.
 */
import { err, ok, Result } from "neverthrow";

import { sendMail } from "../../destinations/amazonses";
import {
    ChannelProvider,
    DeliveryError,
    DeliveryResult,
    EmailContent,
    OutboundMessage,
} from "../channelProvider";

export class SesEmailProvider implements ChannelProvider {
    readonly providerType = "AmazonSes";
    readonly channelType = "Email";

    constructor(
        private readonly region: string,
        private readonly accessKeyId: string,
        private readonly secretAccessKey: string,
    ) { }

    async send(
        message: OutboundMessage,
    ): Promise<Result<DeliveryResult, DeliveryError>> {
        const content = message.content as EmailContent;
        if (content.type !== "email") {
            return err({
                provider: this.providerType,
                message: `Invalid content type: ${content.type}`,
                retryable: false,
            });
        }

        const result = await sendMail({
            config: {
                accessKeyId: this.accessKeyId,
                secretAccessKey: this.secretAccessKey,
                region: this.region,
            },
            mailData: {
                from: content.from,
                to: message.to,
                subject: content.subject,
                html: content.body,
                replyTo: content.replyTo,
                headers: content.headers,
                tags: message.tags,
            },
        });

        if (result.isErr()) {
            const failure = result.error;
            return err({
                provider: this.providerType,
                message: failure instanceof Error ? failure.message : "SES send failed",
                retryable: true,
                originalError: failure,
            });
        }

        return ok({
            messageId: result.value.MessageId ?? `ses-${Date.now()}`,
            status: "sent" as const,
            provider: this.providerType,
            providerResponse: result.value,
        });
    }

    validateConfig(config: Record<string, unknown>): boolean {
        return Boolean(config.region && config.accessKeyId && config.secretAccessKey);
    }
}
