import { err, Result, ResultAsync, ok } from "neverthrow";
import qs from "querystring";

import {
    ChannelProvider,
    SendMessageParams,
    SendMessageResult,
    WebhookProcessParams,
} from "./ChannelProvider";

export interface GupshupSmsConfig {
    userid: string;
    password?: string; // Optional if using token
    token?: string; // Optional if using password
    senderId?: string; // Varies based on DLT registration in India, or general sender
}

export class GupshupSmsProvider implements ChannelProvider {
    name = "gupshup_sms";

    async sendMessage(
        params: SendMessageParams
    ): Promise<Result<SendMessageResult, Error>> {
        const config = params.config as GupshupSmsConfig;

        if (!config?.userid || (!config?.password && !config?.token)) {
            return err(new Error("Invalid Gupshup SMS configuration: missing userid, password or token"));
        }

        // Gupshup Enterprise SMS API endpoint
        const url = "https://enterprise.gupshup.io/smsgateway/sgw/sendsms.php";

        // Required query parameters for Gupshup
        const queryParams: Record<string, string> = {
            userid: config.userid,
            v: "1.1",
            method: "SendMessage",
            send_to: params.to,
            msg_type: "TEXT",
            msg: params.body,
        };

        if (config.password) {
            queryParams.password = config.password;
        } else if (config.token) {
            queryParams.auth_scheme = "token";
            queryParams.token = config.token;
        }

        if (config.senderId) {
            queryParams.mask = config.senderId;
        }

        try {
            const response = await fetch(`${url}?${qs.stringify(queryParams)}`, {
                method: "GET",
            });

            if (!response.ok) {
                return err(new Error(`Gupshup SMS API error: ${response.statusText}`));
            }

            const text = await response.text();

            // Gupshup response format is typically: 
            // Success: "success | 1234567890 | Message Sent"
            // Error: "error | 123 | Error description"
            const [status, idOrCode, message] = text.split(" | ");

            if (status?.trim() === "error") {
                return err(new Error(`Gupshup error [${idOrCode?.trim()}]: ${message?.trim()}`));
            }

            return ok({
                messageId: idOrCode?.trim() ?? "unknown",
                status: "sent",
            });

        } catch (error) {
            return err(error as Error);
        }
    }

    processWebhook(params: WebhookProcessParams): ResultAsync<void, Error> {
        // Typically Gupshup DLR webhooks are pushed to a specified callback URL.
        // This is a placeholder for actual DLR processing which maps Gupshup's
        // Delivered/Failed statuses to InternalEventType.SmsDelivered / Failed.
        return ResultAsync.fromPromise(Promise.resolve(), (e) => new Error(String(e)));
    }
}
