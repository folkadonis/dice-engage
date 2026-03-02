// Channel Abstraction Layer — Barrel Export
export type {
    ChannelProvider,
    OutboundMessage,
    MessageContent,
    EmailContent,
    SmsContent,
    MobilePushContent,
    WebhookContent,
    WhatsAppContent,
    WebPushContent,
    RCSContent,
    DeliveryResult,
    DeliveryError,
    MessageStatus,
} from "./channelProvider";

export { ChannelRegistry, channelRegistry } from "./channelRegistry";

// Email Providers
export { SmtpEmailProvider } from "./email/smtpEmail.provider";
export { SesEmailProvider } from "./email/sesEmail.provider";

// SMS Providers
export { TwilioSmsProvider } from "./sms/twilioSms.provider";
export { GupshupSmsProvider } from "./sms/gupshupSms.provider";

// Push Providers
export { FirebasePushProvider } from "./push/firebasePush.provider";

// WhatsApp Providers
export { TwilioWhatsAppProvider } from "./whatsapp/twilioWhatsApp.provider";
export { GupshupWhatsAppProvider } from "./whatsapp/gupshupWhatsApp.provider";
