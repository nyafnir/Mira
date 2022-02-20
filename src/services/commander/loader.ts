import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import { config } from '@config';
import { models } from '@services/database';
import { BotCommand, IUploadSlashCommandResult } from './types';
import { Client, Collection } from 'discord.js';

export const reload = async (
    client: Client,
    commands: Collection<string, BotCommand>,
    guildId: string | null,
): Promise<void> => {
    await wipe(client, !!guildId);

    const commandsForUpload = commands.map((command) => {
        return {
            name: command.name,
            description: command.description,
            options: command.options,
            default_permission: command.defaultPermission,
        };
    });

    const commandsUploaded = await upload(client, commandsForUpload, guildId);

    // Записываем отданные команды в нашу базу данных
    await models.Command.setCommands(
        commandsUploaded.map((command) => {
            return {
                name: command.name,
                id: command.id,
            };
        }),
    );
};

const wipe = async (
    client: Client,
    isGuildCommands: boolean,
): Promise<void> => {
    // Команды загруженные в режиме разработки самоудаляться через некоторое время
    if (isGuildCommands) {
        return;
    }

    try {
        const commands = client.application?.commands.cache || [];

        for (const [, command] of commands) {
            await command.delete();
        }
    } catch (error) {
        throw new Error(`Удаление команд не удалось: ${error}`);
    }
};

const upload = async (
    client: Client,
    commands: Partial<IUploadSlashCommandResult>[],
    guildId: string | null,
): Promise<IUploadSlashCommandResult[]> => {
    try {
        if (!client.application) {
            throw new Error('Не определен client.application');
        }

        // Используем костыль из официальной документации
        const rest = new REST({ version: '9' }).setToken(config.bot.token);

        // Выгрузка команд на сервер разработки ... иначе в публичный кэш ...
        if (guildId) {
            return (await rest.put(
                Routes.applicationGuildCommands(client.application.id, guildId),
                {
                    body: commands,
                },
            )) as IUploadSlashCommandResult[];
        } else {
            return (await rest.put(
                Routes.applicationCommands(client.application.id),
                {
                    body: commands,
                },
            )) as IUploadSlashCommandResult[];
        }
    } catch (error) {
        throw new Error(`Выгрузка команд не удалась: ${error}`);
    }
};
