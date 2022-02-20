import { config } from '@config';
import { cooldowns } from '@services/cooldowner';
import { log } from '@services/logger';
import { Client, Collection, CommandInteraction } from 'discord.js';
import { BotCommand } from './types';
import { chance, secondsFormattedHMS } from '@utils';

const sendReply = async (interaction: CommandInteraction, message: string) => {
    message = `<@${interaction.user.id}>, ошибка: ${message}`;

    // если сообщение невидимое, то доступа нет - отправляем новое
    if (interaction.ephemeral) {
        return await interaction.followUp({
            content: message,
            ephemeral: true,
        });
    }

    // если мы уже ответили, то ссылаемся на ответ в новом сообщении
    if (interaction.replied) {
        return await interaction.followUp(message);
    }

    // если мы сказали, что думаем над ответом, то редактируем его
    if (interaction.deferred) {
        return await interaction.editReply(message);
    }

    // иначе отвечаем на сообщение обычным способом
    return await interaction.reply(message);
};

export const onInteraction = async (
    client: Client,
    interaction: CommandInteraction,
    commands: Collection<string, BotCommand>,
): Promise<void> => {
    if (!interaction.isCommand()) {
        return;
    }

    const commandName = interaction.commandName.toLowerCase();
    const command = commands.get(commandName);
    if (!command) {
        await sendReply(
            interaction,
            `у меня нет команды \`/${commandName}\` или она была удалена.`,
        ).catch(() => null);
        return;
    }

    // Проверяем откат
    const timeLeft = cooldowns.get(
        interaction.guildId || '0', // 0 - DM
        interaction.user.id,
        command.name,
    );

    if (timeLeft) {
        const messages =
            command.cooldown?.messages ||
            config.settings.default.cooldown.messages;
        await sendReply(
            interaction,
            messages[
                chance.integer({ min: 0, max: messages.length - 1 })
            ].replace('timeLeft', secondsFormattedHMS(timeLeft)),
        );
        return;
    }

    // Установка отката
    cooldowns.set(
        interaction.user.id,
        interaction.guildId || '0', // 0 - DM
        command.name,
        command.cooldown?.seconds,
    );

    if (!interaction.guild) {
        await sendReply(
            interaction,
            `выполнение этой команды недоступно в личных сообщениях.`,
        ).catch(() => null);
        return;
    }

    try {
        await command.execute(
            client,
            interaction,
            interaction.options.data.slice(0),
        ); // Копируем чтобы убрать readonly
    } catch (error) {
        if (error instanceof Error) {
            await sendReply(interaction, error.message).catch(() => null);
        } else {
            await sendReply(
                interaction,
                'попробуй вызывать команду ещё раз или сообщи об этом разработчику.',
            ).catch(() => null);
            log.error('Непредвиденная ошибка: ', error as string);
        }
        // Сброс отката
        cooldowns.set(
            interaction.user.id,
            interaction.guildId || '0', // 0 - DM
            command.name,
        );
    }
};
