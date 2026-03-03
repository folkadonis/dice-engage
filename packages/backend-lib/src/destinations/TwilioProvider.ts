import { err, Result, ResultAsync, ok } from "neverthrow";
import TwilioClient from "twilio";

import {
    ChannelProvider,
    SendMessageParams,
    SendMessageResult,
    WebhookProcessParams,
} from "./ChannelProvider";
import {
    sendSms,
    Sender,
    TwilioAuth,
    TwilioRestException,
    submitTwilioEvents,
} from "./twilio";
import { ChannelType, TwilioInboundSchema, TwilioWebhookRequest } from "../types";

export interface TwilioConfig {
    accountSid: string;
    auth: TwilioAuth;
    sender: Sender;
}

export class TwilioProvider implements ChannelProvider {
    name = "twilio";

    async sendMessage(
        params: SendMessageParams
    ): Promise<Result<SendMessageResult, Error>> {
        const config = params.config as TwilioConfig;

        if (!config?.accountSid || !config?.auth || !config?.sender) {
            return err(new Error("Invalid Twilio configuration"));
        }

        const { accountSid, auth, sender } = config;

        let to = params.to;
        const senderPayload = { ...sender };
        if (params.channel === ChannelType.WhatsApp) {
            if (!to.startsWith("whatsapp:")) {
                to = `whatsapp:${to}`;
            }
            if ("from" in senderPayload && senderPayload.from && !senderPayload.from.startsWith("whatsapp:")) {
                senderPayload.from = `whatsapp:${senderPayload.from}`;
            }
        }

        const result = await sendSms({
            body: params.body,
            to,
            subscriptionGroupId: params.subscriptionGroupId,
            userId: params.userId,
            workspaceId: params.workspaceId,
            accountSid,
            auth,
            ...senderPayload,
            tags: params.tags,
        });

        if (result.isErr()) {
            const error = result.error;
            if (error instanceof TwilioRestException) {
                return err(new Error(`Twilio error: ${error.message}`));
            }
            return err(error);
        }

        return ok({
            messageId: result.value.sid,
            status: "sent",
        });
    }

    processWebhook(params: WebhookProcessParams): ResultAsync<void, Error> {
        const { workspaceId, body } = params;
        const bodyArgs = body as Record<string, unknown>;

        // We assume the body contains the Twilio payload.
        // In a real implementation this requires validation against TwilioInboundSchema
        // and extracting userId/tags from the webhook URL query parameters.

        // For now, this is a placeholder implementation that fulfills the interface
        // but relies on the existing webhook controller for full parsing.
        return ResultAsync.fromPromise(
            Promise.reject(new Error("TwilioProvider.processWebhook not fully implemented for dynamic routing yet.")),
            (e) => (e instanceof Error ? e : new Error(String(e)))
        );
    }
}
