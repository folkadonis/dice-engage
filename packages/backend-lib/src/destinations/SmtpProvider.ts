import { err, Result, ResultAsync, ok } from "neverthrow";

import {
    ChannelProvider,
    SendMessageParams,
    SendMessageResult,
    WebhookProcessParams,
} from "./ChannelProvider";
import {
    sendMail,
    SendSmtpMailParams,
} from "./smtp";
import { EmailProviderType } from "../types";

export interface SmtpConfig {
    host: string;
    port?: number;
    username?: string;
    password?: string;
    from?: string; // fallback if not supplied
}

export class SmtpProvider implements ChannelProvider {
    name = "smtp";

    async sendMessage(
        params: SendMessageParams
    ): Promise<Result<SendMessageResult, Error>> {
        const config = params.config as SmtpConfig;

        if (!config?.host) {
            return err(new Error("Invalid SMTP configuration: missing host"));
        }

        let mailData: SendSmtpMailParams;
        try {
            mailData = {
                host: config.host,
                port: config.port,
                username: config.username,
                password: config.password,
                type: EmailProviderType.Smtp,
                to: params.to,
                from: config.from ?? "noreply@diceengage.com",
                subject: "Dice Engage Message",
                body: params.body,
            };
        } catch (e) {
            return err(e as Error);
        }

        const result = await sendMail(mailData);

        if (result.isErr()) {
            return err(new Error(result.error.message));
        }

        return ok({
            messageId: result.value.messageId ?? "unknown",
            status: "queued", // SMTP is usually queued or immediate
        });
    }

    processWebhook(params: WebhookProcessParams): ResultAsync<void, Error> {
        // SMTP generally doesn't have a single webhooks endpoint like managed providers,
        // bounce tracking happens via VERP and IMAP polling which is outside this scope.
        return ResultAsync.fromPromise(Promise.resolve(), (e) => (e as Error));
    }
}
