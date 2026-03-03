/**
 * Firebase Cloud Messaging (FCM) Push Provider Adapter
 *
 * Wraps the existing `sendNotification` from `destinations/fcm.ts`
 * behind the unified ChannelProvider interface.
 */
import { err, ok, Result } from "neverthrow";

import { sendNotification } from "../../destinations/fcm";
import {
    ChannelProvider,
    DeliveryError,
    DeliveryResult,
    MobilePushContent,
    OutboundMessage,
} from "../channelProvider";

export class FirebasePushProvider implements ChannelProvider {
    readonly providerType = "Firebase";
    readonly channelType = "MobilePush";

    constructor(private readonly serviceAccountKey: string) { }

    async send(
        message: OutboundMessage,
    ): Promise<Result<DeliveryResult, DeliveryError>> {
        const content = message.content as MobilePushContent;
        if (content.type !== "mobilePush") {
            return err({
                provider: this.providerType,
                message: `Invalid content type: ${content.type}`,
                retryable: false,
            });
        }

        // FCM sendNotification takes Message & { key }
        // `message.to` is the FCM token
        const result = await sendNotification({
            key: this.serviceAccountKey,
            token: message.to,
            notification: {
                title: content.title,
                body: content.body,
                imageUrl: content.imageUrl,
            },
            data: content.data,
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
            messageId: result.value,
            status: "sent" as const,
            provider: this.providerType,
            providerResponse: result.value,
        });
    }

    validateConfig(config: Record<string, unknown>): boolean {
        return Boolean(config.serviceAccountKey || config.projectId);
    }
}
