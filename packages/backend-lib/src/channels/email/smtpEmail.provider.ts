/**
 * SMTP Email Provider Adapter
 *
 * Wraps the existing `sendMail` from `destinations/smtp.ts` behind
 * the unified ChannelProvider interface.
 */
import { err, ok, Result } from "neverthrow";

import { sendMail } from "../../destinations/smtp";
import { EmailProviderType } from "../../types";
import {
    ChannelProvider,
    DeliveryError,
    DeliveryResult,
    EmailContent,
    OutboundMessage,
} from "../channelProvider";

export class SmtpEmailProvider implements ChannelProvider {
    readonly providerType = "Smtp";
    readonly channelType = "Email";

    constructor(
        private readonly host: string,
        private readonly username: string,
        private readonly password: string,
        private readonly port?: number,
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
            type: EmailProviderType.Smtp,
            host: this.host,
            port: this.port,
            username: this.username,
            password: this.password,
            from: content.from,
            to: message.to,
            subject: content.subject,
            body: content.body,
            replyTo: content.replyTo,
            headers: content.headers,
        });

        if (result.isErr()) {
            return err({
                provider: this.providerType,
                message: result.error.message,
                retryable: true,
                originalError: result.error,
            });
        }

        return ok({
            messageId: result.value.messageId,
            status: "sent" as const,
            provider: this.providerType,
            providerResponse: result.value,
        });
    }

    validateConfig(config: Record<string, unknown>): boolean {
        return Boolean(config.host && config.username && config.password);
    }
}
