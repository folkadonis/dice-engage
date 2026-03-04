import { err, Result, ResultAsync, ok } from "neverthrow";

import {
    ChannelProvider,
    SendMessageParams,
    SendMessageResult,
    WebhookProcessParams,
} from "./ChannelProvider";

// https://www.gupshup.io/developer/docs/bot-platform/guide/whatsapp-api-documentation
export interface GupshupWhatsappConfig {
    apikey: string;
    source: string; // The Gupshup WhatsApp Business Number
    appName?: string;
}

export class GupshupWhatsappProvider implements ChannelProvider {
    name = "gupshup_whatsapp";

    async sendMessage(
        params: SendMessageParams
    ): Promise<Result<SendMessageResult, Error>> {
        const config = params.config as GupshupWhatsappConfig;

        if (!config?.apikey || !config?.source) {
            return err(new Error("Invalid Gupshup WhatsApp configuration: missing apikey or source"));
        }

        const url = "https://api.gupshup.io/wa/api/v1/msg";

        const fetchConfig: RequestInit = {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                apikey: config.apikey,
            },
            body: new URLSearchParams({
                channel: "whatsapp",
                source: config.source,
                destination: params.to,
                // Assuming params.body contains a serialized JSON string representing the Gupshup message payload
                // e.g. '{"type": "text", "text": "Hello World"}'
                // or a template object for Whatsapp Templates
                message: params.body,
            }),
        };

        if (config.appName) {
            (fetchConfig.body as URLSearchParams).append("src.name", config.appName);
        }

        try {
            const response = await fetch(url, fetchConfig);

            if (!response.ok) {
                const errBody = await response.text();
                return err(new Error(`Gupshup WA API error: ${response.status} ${errBody}`));
            }

            const data = (await response.json()) as Record<string, any>;
            const status = data.status; // e.g., "submitted" 
            const messageId = data.messageId;

            if (status === "error") {
                return err(new Error(`Gupshup WA Error: ${JSON.stringify(data.error)}`));
            }

            return ok({
                messageId: messageId ?? "unknown",
                status: "sent",
            });

        } catch (e) {
            return err(e as Error);
        }
    }

    processWebhook(params: WebhookProcessParams): ResultAsync<void, Error> {
        // Gupshup WA pushes webhooks for read, sent, delivered, failed
        // Map these states to internal tracking events
        return ResultAsync.fromPromise(Promise.resolve(), (e) => new Error(String(e)));
    }
}
