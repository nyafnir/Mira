import {
    Message,
    SelectMenuInteraction,
    User as DiscordUser,
    GuildMember as DiscordGuildMember,
    Guild as DiscordGuild,
    Role as DiscordRole,
    ButtonInteraction,
    MessageButton,
    MessageButtonStyleResolvable,
    MessageActionRow,
    Collection,
    MessageEmbed,
    MessageReaction,
    CommandInteraction,
    Permissions,
} from 'discord.js';
import { client } from '@services/client';
import { config } from '@config';
import { emojiCharacters } from './';

// На указанном сообщении ждать выбор в меню и вернуть результат
export const awaitSelectInMenuByUser = async (
    message: Message,
    userId: string,
): Promise<string[]> => {
    const filter = async (selectMenuInteraction: SelectMenuInteraction) => {
        await selectMenuInteraction.deferUpdate(); // Скрываем меню показывая статус загрузки
        return selectMenuInteraction.user.id === userId;
    };

    const result = await message
        .awaitMessageComponent({
            filter,
            componentType: 'SELECT_MENU',
            time: config.settings.default.menu.timeout,
        })
        .then(
            (selectMenuInteraction: SelectMenuInteraction) =>
                selectMenuInteraction,
        )
        .catch(() => null);

    if (result === null) {
        throw new Error('Время вышло!');
    }

    return result.values;
};

export class MyButton {
    constructor(
        customId: string,
        value: boolean,
        labelOn: string,
        labelOff: string = labelOn,
        emojiOn = emojiCharacters.yes,
        emojiOff = emojiCharacters.no,
        styleOn: MessageButtonStyleResolvable = 'SUCCESS',
        styleOff: MessageButtonStyleResolvable = 'DANGER',
    ) {
        this.customId = customId;

        this.value = value;

        this.labelOn = labelOn;
        this.labelOff = labelOff;

        this.emojiOn = emojiOn;
        this.emojiOff = emojiOff;

        this.styleOn = styleOn;
        this.styleOff = styleOff;
    }

    customId: string;

    value: boolean;

    labelOn: string;
    labelOff: string;

    emojiOn: string;
    emojiOff: string;

    styleOn: MessageButtonStyleResolvable;
    styleOff: MessageButtonStyleResolvable;

    get messageButton(): MessageButton {
        return new MessageButton()
            .setCustomId(this.customId)
            .setEmoji(this.value ? this.emojiOn : this.emojiOff)
            .setLabel(this.value ? this.labelOn : this.labelOff)
            .setStyle(this.value ? this.styleOn : this.styleOff);
    }

    toggle(): void {
        this.value = !this.value;
    }
}

// На указанном сообщении ждать укаазанное время, а затем вернуть "имя_кнопки: значение"[]
export const awaitChangedButtonsByUser = async (
    interaction: CommandInteraction,
    embed: MessageEmbed,
    myButtons: MyButton[],
): Promise<{ [key: string]: boolean } | null> => {
    const message = (await interaction.editReply({
        embeds: [embed],
        components: [],
    })) as Message;

    myButtons.push(
        new MyButton(
            'save_change_buttons',
            true,
            'Сохранить',
            undefined,
            '',
            '',
            'PRIMARY',
        ),
    );

    myButtons.push(
        new MyButton(
            'cancel_change_buttons',
            false,
            'Отменить',
            undefined,
            '',
            '',
            undefined,
            'SECONDARY',
        ),
    );

    let isCancel = false;

    const buttons = new Collection(
        myButtons.map((myButton) => [myButton.customId, myButton]),
    );

    const row = () =>
        new MessageActionRow().addComponents(
            buttons.map((button) => button.messageButton),
        );

    await message.edit({ components: [row()] });

    const filter = async (buttonInteraction: ButtonInteraction) => {
        if (buttonInteraction.user.id === interaction.user.id) {
            if (buttonInteraction.customId === 'cancel_change_buttons') {
                isCancel = true;
                return true;
            } else if (buttonInteraction.customId === 'save_change_buttons') {
                return true;
            }

            buttons.get(buttonInteraction.customId)?.toggle();
            await buttonInteraction.update({ components: [row()] });
        }

        return false; // До таймаута
    };

    await message
        .awaitMessageComponent({
            filter,
            componentType: 'BUTTON',
            time: config.settings.default.button.timeout,
        })
        .catch(() => null);

    if (isCancel) {
        return null;
    }

    buttons.delete('save_change_buttons');
    buttons.delete('cancel_change_buttons');

    const result: { [key: string]: boolean } = {};

    for (const [, button] of buttons) {
        result[button.customId] = button.value;
    }

    return result;
};

// Дать пользователю возможность листать массив данных с помощью реакций
export const messageEmbedWithPages = async (
    interaction: CommandInteraction,
    embed: MessageEmbed,
    data: string[],
): Promise<void> => {
    const topSize =
        config.settings.default.list.size > data.length
            ? data.length
            : config.settings.default.list.size;

    const pages: string[][] = [];
    for (let i = 0; i < Math.ceil(data.length / topSize); i += 1) {
        pages.push(data.slice(i * topSize, i * topSize + topSize));
    }

    let pageNumber = 0;

    const update = async () => {
        embed
            .setDescription(pages[pageNumber].join('\n') || 'Пусто')
            .setFooter(
                `Страница: ${pageNumber}/${pages.length} ${
                    pages.length <= 1
                        ? ''
                        : `| У тебя ${
                              config.settings.default.list.timeout / 1000
                          } секунд`
                }`,
            );
        return (await interaction.editReply({
            embeds: [embed],
            components: [],
        })) as Message;
    };

    const message = await update();

    if (pages.length <= 1) {
        return;
    }

    const filter = async (
        messageReaction: MessageReaction,
        user: DiscordUser,
    ) => {
        if (user.id === interaction.user.id) {
            const reaction = messageReaction.emoji.toString();
            if (reaction === emojiCharacters.arrow_left) {
                if (pageNumber - 1 >= 0) {
                    pageNumber -= 1;
                }
            } else if (reaction === emojiCharacters.arrow_right) {
                if (pageNumber + 1 < pages.length) {
                    pageNumber += 1;
                }
            } else {
                return true;
            }

            await update();
        }

        return false;
    };

    await Promise.all([
        async () => {
            await message.react(emojiCharacters.arrow_left);
            await message.react(emojiCharacters.arrow_right);
            await message.react(emojiCharacters.no);
        },
        message
            .awaitReactions({
                filter,
                time: config.settings.default.list.size,
            })
            .catch(() => null),
    ]);

    await message.reactions.removeAll();
};

export const getDiscordUser = async (
    userId: string,
): Promise<DiscordUser | null> => {
    return (
        client.users.cache.get(userId) ||
        client.users.resolve(userId) ||
        (await client.users.fetch(userId))
    );
};

export const getDiscordGuild = async (
    guildId: string,
): Promise<DiscordGuild | null> => {
    return (
        client.guilds.cache.get(guildId) ||
        client.guilds.resolve(guildId) ||
        (await client.guilds.fetch(guildId))
    );
};

export const getDiscordGuildMember = async (
    userId: string,
    guild: DiscordGuild,
): Promise<DiscordGuildMember | null> => {
    return (
        guild.members.cache.get(userId) ||
        guild.members.resolve(userId) ||
        (await guild.members.fetch(userId))
    );
};

export const getDiscordRole = async (
    roleId: string,
    guild: DiscordGuild,
): Promise<DiscordRole | null> => {
    return (
        guild.roles.cache.get(roleId) ||
        guild.roles.resolve(roleId) ||
        (await guild.roles.fetch(roleId))
    );
};

export const checkPermissionsForDiscordGuildMember = (
    memberPermissions: string | Readonly<Permissions>,
    checkPermission = Permissions.FLAGS.ADMINISTRATOR,
    errorMessage = 'у тебя недостаточно прав для этого действия.',
): void => {
    if ((memberPermissions as Permissions).has(checkPermission) === false) {
        throw new Error(errorMessage);
    }
};
