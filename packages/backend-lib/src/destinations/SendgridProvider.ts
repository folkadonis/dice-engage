import { err, Result, ResultAsync, ok } from "neverthrow";
import sendgridMail from "@sendgrid/mail";

import {
    ChannelProvider,
    SendMessageParams,
    SendMessageResult,
    WebhookProcessParams,
} from "./ChannelProvider";
import {
    sendMail,
    handleSendgridEvents,
} from "./sendgrid";
import { SendgridEvent } from "../types";

export interface SendgridConfig {
    apiKey: string;
}

export class SendgridProvider implements ChannelProvider {
    name = "sendgrid";

    async sendMessage(
        params: SendMessageParams
    ): Promise<Result<SendMessageResult, Error>> {
        const config = params.config as SendgridConfig;

        if (!config?.apiKey) {
            return err(new Error("Invalid Sendgrid configuration"));
        }

        let mailData: sendgridMail.MailDataRequired;
        try {
            // Basic mapping of SendMessageParams to Sendgrid's expected MailDataRequired
            // In real implementations, `params.body` could either be plain text
            // or HTML, and further options exist.
            mailData = {
                to: params.to,
                // In a complete implementation, this would likely be drawn from config/tenant settings
                from: "noreply@diceengage.com",
                subject: "Dice Engage Message",
                html: params.body,
                customArgs: params.tags as Record<string, string>,
            };
        } catch (e) {
            return err(e as Error);
        }

        const result = await sendMail({
            apiKey: config.apiKey,
            mailData,
        });

        if (result.isErr()) {
            return err(new Error(result.error.message));
        }

        // SendGrid's response headers usually contain the message ID.
        // However, the exact header name can vary or be absent depending on SendGrid settings.
        const messageId = result.value?.headers?.["x-message-id"] ?? "unknown";

        return ok({
            messageId,
            status: "queued", // SendGrid returns a 202 Accepted, indicating queued
        });
    }

    processWebhook(params: WebhookProcessParams): ResultAsync<void, Error> {
        const { body, headers } = params;

        const signature = headers["x-twilio-email-event-webhook-signature"] ?? "";
        const timestamp = headers["x-twilio-email-event-webhook-timestamp"] ?? "";
        const rawBody = (params as any).rawBody; // Required for signature validation

        // This calls the existing webhook parsing logic
        return ResultAsync.fromPromise(
            handleSendgridEvents({
                sendgridEvents: body as SendgridEvent[],
                webhookSignature: signature,
                webhookTimestamp: timestamp,
                rawBody,
            }),
            (e) => (e instanceof Error ? e : new Error(String(e)))
        ).andThen((res) => {
            if (res.isErr()) {
                return err(new Error(res.error.message));
            }
            return ok(undefined);
        });
    }
}
