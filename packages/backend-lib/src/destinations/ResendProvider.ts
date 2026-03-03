import { err, Result, ResultAsync, ok } from "neverthrow";
import { ErrorResponse } from "resend";

import {
    ChannelProvider,
    SendMessageParams,
    SendMessageResult,
    WebhookProcessParams,
} from "./ChannelProvider";
import {
    sendMail,
    ResendRequiredData,
    submitResendEvents,
} from "./resend";
import { ResendEvent } from "../types";

export interface ResendConfig {
    apiKey: string;
}

export class ResendProvider implements ChannelProvider {
    name = "resend";

    async sendMessage(
        params: SendMessageParams
    ): Promise<Result<SendMessageResult, Error>> {
        const config = params.config as ResendConfig;

        if (!config?.apiKey) {
            return err(new Error("Invalid Resend configuration"));
        }

        let mailData: ResendRequiredData;
        try {
            // Assume `params.body` is HTML and `params.to` is the recipient.
            mailData = {
                to: params.to,
                from: "noreply@diceengage.com", // This would normally come from config or tags
                subject: "Dice Engage Message",
                html: params.body,
                tags: params.tags ? Object.entries(params.tags).map(([name, value]) => ({ name, value })) : [],
            };
        } catch (e) {
            return err(e as Error);
        }

        const result = await sendMail({
            apiKey: config.apiKey,
            mailData,
        });

        if (result.isErr()) {
            return err(new Error((result.error as ErrorResponse).message));
        }

        return ok({
            messageId: result.value.data?.id ?? "unknown",
            status: "sent",
        });
    }

    processWebhook(params: WebhookProcessParams): ResultAsync<void, Error> {
        const { workspaceId, body } = params;

        // Body is expected to be an array of ResendEvents or a single event
        const events = Array.isArray(body) ? body : [body];

        return ResultAsync.fromPromise(
            submitResendEvents({
                workspaceId,
                events: events as ResendEvent[],
            }),
            (e) => (e instanceof Error ? e : new Error(String(e)))
        );
    }
}
