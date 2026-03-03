import { err, Result, ResultAsync, ok } from "neverthrow";
import webpush from "web-push";

import {
    ChannelProvider,
    SendMessageParams,
    SendMessageResult,
    WebhookProcessParams,
} from "./ChannelProvider";

export interface WebPushConfig {
    vapidSubject: string; // e.g. "mailto: contact@diceengage.com"
    vapidPublicKey: string;
    vapidPrivateKey: string;
}

export class WebPushProvider implements ChannelProvider {
    name = "webpush";

    async sendMessage(
        params: SendMessageParams
    ): Promise<Result<SendMessageResult, Error>> {
        const config = params.config as WebPushConfig;

        if (!config?.vapidSubject || !config?.vapidPublicKey || !config?.vapidPrivateKey) {
            return err(new Error("Invalid WebPush configuration: missing VAPID keys"));
        }

        try {
            webpush.setVapidDetails(
                config.vapidSubject,
                config.vapidPublicKey,
                config.vapidPrivateKey
            );

            // params.to should be a JSON-stringified push subscription object.
            const subscription: webpush.PushSubscription = JSON.parse(params.to);

            // Send Notification
            // params.body is usually stringified Notification payload 
            // Example: JSON.stringify({ title: "Alert", body: "Hello World", icon: "/icon.png" })
            const sendResult = await webpush.sendNotification(
                subscription,
                params.body
            );

            return ok({
                messageId: sendResult.headers?.["location"] ?? "unknown",
                status: "sent",
            });

        } catch (e) {
            return err(e as Error);
        }
    }

    processWebhook(params: WebhookProcessParams): ResultAsync<void, Error> {
        // Web Push typically doesn't send delivery webhooks. 
        // Deliveries are handled by the browser pushing an event to the service worker.
        // Usually, metrics are gathered by the service worker pinging an analytics endpoint separately.
        return ResultAsync.fromPromise(Promise.resolve(), (e) => new Error(String(e)));
    }
}
