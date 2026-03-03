import { ChannelType, WhatsAppProviderType, WhatsAppTemplateResource } from "./types";

export function defaultWhatsappDefinition(): WhatsAppTemplateResource {
    return {
        type: ChannelType.WhatsApp,
        body: "Example message to {{ user.phone }}",
    };
}

export const WhatsAppProviderTypeSet = new Set<string>(
    Object.values(WhatsAppProviderType),
);

export function isWhatsAppProviderType(s: unknown): s is WhatsAppProviderType {
    if (typeof s !== "string") return false;
    return WhatsAppProviderTypeSet.has(s);
}
