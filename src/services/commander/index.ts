import { Collection, CommandInteraction, Client } from 'discord.js';
import { models } from '@services/database';
import { onMessageReaction } from '@events';
import { getAllFiles } from '@utils';
import { onInteraction } from './interaction';
import { reload } from './loader';
import { BotCommand } from './types';
export { BotCommand, ArgType } from './types';

export const listCommands = new Collection<string, BotCommand>();

export const initCommands = async (client: Client, guildId: string | null) => {
    if (listCommands.size) {
        return;
    }

    const arrayOfFiles = getAllFiles(__dirname + '/../../commands');
    for await (const filePath of arrayOfFiles) {
        const command = await import(filePath);
        listCommands.set(command.name, command);
    }

    const commands = await models.Command.getAll(false);
    // Если в базе данных нет следов команд, то удалить из дискорда и загрузить
    if (commands.length === 0) {
        await reload(client, listCommands, guildId);
    }

    client.on(
        'interactionCreate',
        async (interaction) =>
            await onInteraction(
                client,
                interaction as CommandInteraction,
                listCommands,
            ),
    );

    client
        .on(
            'messageReactionAdd',
            async (reaction, user) =>
                await onMessageReaction(reaction, user, true),
        )
        .on(
            'messageReactionRemove',
            async (reaction, user) =>
                await onMessageReaction(reaction, user, false),
        );
};
