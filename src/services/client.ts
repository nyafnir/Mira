import { Client, Intents } from 'discord.js';
import { config } from '@config';
import { log } from '@services/logger';

export let client: Client;

export const initClient = async (): Promise<Client> => {
    if (client) {
        throw new Error('Клиент уже был инициализирован.');
    }

    client = new Client({
        // Кэширование элементов существовавших до запуска
        partials: ['MESSAGE', 'REACTION', 'USER', 'GUILD_MEMBER', 'CHANNEL'],
        // Доступ к данным конкретных областей
        intents: [
            Intents.FLAGS.GUILDS,
            Intents.FLAGS.GUILD_MEMBERS,
            Intents.FLAGS.GUILD_BANS,
            Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
            Intents.FLAGS.GUILD_INTEGRATIONS,
            Intents.FLAGS.GUILD_WEBHOOKS,
            Intents.FLAGS.GUILD_INVITES,
            Intents.FLAGS.GUILD_VOICE_STATES,
            Intents.FLAGS.GUILD_PRESENCES,
            Intents.FLAGS.GUILD_MESSAGES,
            Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
            // Intents.FLAGS.GUILD_MESSAGE_TYPING,
            Intents.FLAGS.DIRECT_MESSAGES,
            Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
            // Intents.FLAGS.DIRECT_MESSAGE_TYPING,
        ],
        allowedMentions: {
            parse: ['users', 'roles', 'everyone'],
            repliedUser: true,
        },
    });

    client.on('disconnect', () => log.error('Соединение потеряно!'));

    client.on('warn', log.warn);

    client.on('error', (error) => log.error(error.name, error.message));

    client
        // При каждом восстановлении соединения
        .on('ready', () => {
            log.info(`Бот ${client.user?.tag || config.bot.name} на связи!`);
        });

    await client.login(config.bot.token);

    if (client.user === null) {
        throw new Error('Не удалось получить данные об аккаунте бота.');
    }

    client.user.setPresence({
        status: 'online',
        activities: [
            {
                name: `/help`,
                type: 'WATCHING',
            },
        ],
    });

    return client;
};

export const destroyClient = (): boolean => {
    if (!client) {
        return false;
    }

    client.destroy();

    return true;
};
