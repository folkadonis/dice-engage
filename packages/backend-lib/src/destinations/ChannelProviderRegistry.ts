import { Result, ResultAsync, ok, err } from "neverthrow";

import { ChannelProvider } from "./ChannelProvider";

class ChannelProviderRegistry {
    private providers: Map<string, ChannelProvider> = new Map();

    /**
     * Register a new channel provider.
     */
    register(provider: ChannelProvider): void {
        if (this.providers.has(provider.name)) {
            throw new Error(`Provider with name ${provider.name} is already registered.`);
        }
        this.providers.set(provider.name, provider);
    }

    /**
     * Get a registered channel provider by name.
     */
    getProvider(name: string): Result<ChannelProvider, Error> {
        const provider = this.providers.get(name);
        if (!provider) {
            return err(new Error(`Provider with name ${name} not found.`));
        }
        return ok(provider);
    }

    /**
     * Returns a list of all registered providers.
     */
    getAllProviders(): ChannelProvider[] {
        return Array.from(this.providers.values());
    }
}

export const channelProviderRegistry = new ChannelProviderRegistry();
