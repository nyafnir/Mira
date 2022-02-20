import { Collection, Snowflake } from 'discord.js';
import { config } from '@config';

const listCooldowns = new Collection<Snowflake, number>();

const getKey = (userId: string, guildId: string, commandName: string): string =>
    `${guildId}_${userId}_${commandName}`;

export const cooldowns = {
    // Возвращает секунды до отката
    get: (userId: string, guildId: string, commandName: string): number => {
        const cooldown = listCooldowns.get(
            getKey(userId, guildId, commandName),
        );
        return cooldown !== undefined && cooldown > Date.now()
            ? (cooldown - Date.now()) / 1000
            : 0;
    },
    set: (
        userId: string,
        guildId: string,
        commandName: string,
        seconds: number = config.settings.default.cooldown.seconds,
    ): void => {
        listCooldowns.set(
            getKey(userId, guildId, commandName),
            Date.now() + seconds * 1000,
        );
    },
};
