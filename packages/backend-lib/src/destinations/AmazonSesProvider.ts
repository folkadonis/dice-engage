import { err, Result, ResultAsync, ok } from "neverthrow";
import { SendEmailCommandOutput, SESv2ServiceException } from "@aws-sdk/client-sesv2";

import {
    ChannelProvider,
    SendMessageParams,
    SendMessageResult,
    WebhookProcessParams,
} from "./ChannelProvider";
import {
    sendMail,
    SesMailData,
    submitAmazonSesEvents,
} from "./amazonses";
import { AmazonSesConfig, AmazonSesEventPayload } from "../types";

export class AmazonSesProvider implements ChannelProvider {
    name = "amazonses";

    async sendMessage(
        params: SendMessageParams
    ): Promise<Result<SendMessageResult, Error>> {
        const config = params.config as AmazonSesConfig;

        if (!config?.accessKeyId || !config?.secretAccessKey || !config?.region) {
            return err(new Error("Invalid Amazon SES configuration"));
        }

        // Try to map SendMessageParams to Amazon SES MailData format.
        let mailData: SesMailData;
        try {
            // In a real application, the body might contain JSON that defines the HTML, From, To, Subject, etc.
            // Or params would be extended to include these. This is a baseline adaptation.
            // We assume `params.body` is the HTML content and `params.to` is the recipient.
            mailData = {
                to: params.to,
                from: config.fromAddress || "noreply@diceengage.com", // Assuming a default from config
                subject: "Dice Engage Message",
                html: params.body,
                tags: params.tags as Record<string, string>,
            };
        } catch (e) {
            return err(e as Error);
        }

        const result = await sendMail({
            config,
            mailData,
        });

        if (result.isErr()) {
            return err(result.error as Error);
        }

        return ok({
            messageId: result.value.MessageId ?? "unknown",
            status: "sent",
        });
    }

    processWebhook(params: WebhookProcessParams): ResultAsync<void, Error> {
        const { body } = params;

        return ResultAsync.fromPromise(
            submitAmazonSesEvents(body as AmazonSesEventPayload),
            (e) => (e instanceof Error ? e : new Error(String(e)))
        ).andThen((ra) => ra);
    }
}
