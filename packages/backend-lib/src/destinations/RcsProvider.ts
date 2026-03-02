import { err, Result, ResultAsync, ok } from "neverthrow";
import qs from "querystring";

import {
    ChannelProvider,
    SendMessageParams,
    SendMessageResult,
    WebhookProcessParams,
} from "./ChannelProvider";

// This will vary wildly based on the underlying RCS provider (Sinch, Twilio, Google, etc.)
// For this example, let's assume a generic REST implementation that falls back to SMS
export interface RcsConfig {
    apiKey: string;
    senderId: string;
    fallbackSmsProviderId?: string; // ID of configured SMS provider
}

export class RcsProvider implements ChannelProvider {
    name = "rcs";

    async sendMessage(
        params: SendMessageParams
    ): Promise<Result<SendMessageResult, Error>> {
        const config = params.config as RcsConfig;

        if (!config?.apiKey || !config?.senderId) {
            return err(new Error("Invalid RCS configuration: missing apiKey or senderId"));
        }

        // Generic placeholder URL for an RCS API
        const url = "https://api.rcsprovider.example.com/v1/send";

        try {
            // Attempt to send RCS
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${config.apiKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    from: config.senderId,
                    to: params.to,
                    fallback: config.fallbackSmsProviderId ? true : false,
                    content: params.body // Contains the generic payload (could be JSON with rich cards)
                }),
            });

            if (!response.ok) {
                const errBody = await response.text();
                // In a real system, we might catch the RCS capability error here
                // and manually route to the `fallbackSmsProviderId` via our ChannelProviderRegistry.
                // But many providers handle SMS fallback on their end.
                return err(new Error(`RCS API error: ${response.status} ${errBody}`));
            }

            const data = await response.json();

            return ok({
                messageId: data.messageId ?? "unknown",
                status: "sent",
            });

        } catch (e) {
            return err(e as Error);
        }
    }

    processWebhook(params: WebhookProcessParams): ResultAsync<void, Error> {
        // RCS provides read receipts, typing indicators, payload, etc.
        // This maps back to DF's InternalEventType.
        return ResultAsync.fromPromise(Promise.resolve(), (e) => new Error(String(e)));
    }
}
