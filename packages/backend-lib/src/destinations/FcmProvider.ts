import { err, ok, Result, ResultAsync } from "neverthrow";
import { Message } from "firebase-admin/messaging";

import {
    ChannelProvider,
    SendMessageParams,
    SendMessageResult,
    WebhookProcessParams,
} from "./ChannelProvider";
import { sendNotification } from "./fcm";

// Defines the configuration payload for FCM
export interface FcmConfig {
    key: string;
}

export class FcmProvider implements ChannelProvider {
    name = "fcm";

    async sendMessage(
        params: SendMessageParams
    ): Promise<Result<SendMessageResult, Error>> {
        const config = params.config as FcmConfig;

        if (!config?.key) {
            return err(new Error("Invalid FCM configuration: missing key"));
        }

        // Try to map SendMessageParams (body, to etc) to Firebase Message format.
        // In actual implementation, `params.body` should probably be JSON stringified
        // Firebase DataMessagePayload or NotificationMessagePayload
        let fcmMessage: Message;
        try {
            fcmMessage = {
                token: params.to, // Assuming 'to' is the FCM device token
                // A basic notification structure for FCM
                notification: {
                    title: "Dice Engage",
                    body: params.body,
                },
            };
        } catch (e) {
            return err(e as Error);
        }

        const result = await sendNotification({
            ...fcmMessage,
            key: config.key,
        });

        if (result.isErr()) {
            return err(result.error);
        }

        return ok({
            messageId: result.value,
            status: "sent",
        });
    }

    processWebhook(params: WebhookProcessParams): ResultAsync<void, Error> {
        // FCM does not typically send webhooks for delivery status in the same way 
        // Twilio or Mail providers do. It's usually handled client-side or via 
        // BigQuery export. Thus, returning ok(void) to ignore.
        return ResultAsync.fromPromise(Promise.resolve(), (e) => (e as Error));
    }
}
