import logger from "../logger";
import { ChannelProvider } from "./channelProvider";

/**
 * Dynamic channel provider registry.
 *
 * Stores providers keyed by `channelType:providerType` and allows
 * runtime registration, lookup, and listing. Used by the messaging
 * layer to resolve which provider to use for a given workspace + channel.
 *
 * Example:
 *   registry.register(twilioSmsProvider);
 *   const provider = registry.getProvider("Sms", "Twilio");
 */
export class ChannelRegistry {
    private providers: Map<string, ChannelProvider> = new Map();

    private static instance: ChannelRegistry | null = null;

    private makeKey(channelType: string, providerType: string): string {
        return `${channelType}:${providerType}`;
    }

    /**
     * Register a provider in the registry.
     */
    register(provider: ChannelProvider): void {
        const key = this.makeKey(provider.channelType, provider.providerType);
        if (this.providers.has(key)) {
            logger().warn(
                { channelType: provider.channelType, providerType: provider.providerType },
                "Overwriting existing provider registration",
            );
        }
        this.providers.set(key, provider);
        logger().info(
            { channelType: provider.channelType, providerType: provider.providerType },
            "Provider registered",
        );
    }

    /**
     * Get a specific provider by channel + provider type.
     */
    getProvider(channelType: string, providerType: string): ChannelProvider | undefined {
        return this.providers.get(this.makeKey(channelType, providerType));
    }

    /**
     * List all registered providers for a given channel.
     */
    listProviders(channelType: string): ChannelProvider[] {
        const result: ChannelProvider[] = [];
        for (const [key, provider] of this.providers) {
            if (key.startsWith(`${channelType}:`)) {
                result.push(provider);
            }
        }
        return result;
    }

    /**
     * List all registered channel types.
     */
    listChannelTypes(): string[] {
        const channels = new Set<string>();
        for (const provider of this.providers.values()) {
            channels.add(provider.channelType);
        }
        return Array.from(channels);
    }

    /**
     * Check if a specific provider is registered.
     */
    hasProvider(channelType: string, providerType: string): boolean {
        return this.providers.has(this.makeKey(channelType, providerType));
    }

    /**
     * Get or create the singleton registry instance.
     */
    static getInstance(): ChannelRegistry {
        if (!ChannelRegistry.instance) {
            ChannelRegistry.instance = new ChannelRegistry();
        }
        return ChannelRegistry.instance;
    }

    /**
     * Reset the registry (used in testing).
     */
    static resetInstance(): void {
        ChannelRegistry.instance = null;
    }
}

/**
 * Get the global channel registry singleton.
 */
export function channelRegistry(): ChannelRegistry {
    return ChannelRegistry.getInstance();
}
