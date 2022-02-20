import {
    CommandInteraction,
    Message,
    MessageActionRow,
    MessageEmbed,
    MessageSelectMenu,
    GuildTextBasedChannel,
    Client,
} from 'discord.js';
import { ArgType } from '@services/commander';
import { models } from '@services/database';
import { config } from '@config';
import { cooldowns } from '@services/cooldowner';
import {
    emojiCharacters,
    awaitSelectInMenuByUser,
    messageEmbedWithPages,
} from '@utils';

module.exports = {
    name: __filename.slice(__dirname.length + 1).split('.')[0],
    description: 'Роли по реакции к сообщениям',
    usage: '[list / set / remove]',
    options: [
        {
            name: 'list',
            description: 'Список отслеживаемых сообщений',
            type: ArgType.SUB_COMMAND,
            options: [
                {
                    name: 'message_id',
                    description: 'Показать список RR сообщения',
                    required: false,
                    type: ArgType.STRING,
                },
                {
                    name: 'channel',
                    description: 'В каком канале (по умолчанию: в этом)',
                    required: false,
                    type: ArgType.CHANNEL,
                },
            ],
        },
        {
            name: 'set',
            description: 'Добавить RR (обновить, если реакция совпала)',
            type: ArgType.SUB_COMMAND,
            options: [
                {
                    name: 'message_id',
                    description: 'К какому сообщению',
                    required: true,
                    type: ArgType.STRING,
                },
                {
                    name: 'reaction',
                    description: 'Какую реакцию',
                    required: true,
                    type: ArgType.STRING,
                },
                {
                    name: 'role',
                    description: 'Какую роль',
                    required: true,
                    type: ArgType.ROLE,
                },
                {
                    name: 'channel',
                    description: 'В каком канале (по умолчанию: в этом)',
                    required: false,
                    type: ArgType.CHANNEL,
                },
            ],
        },
        {
            name: 'remove',
            description: 'Удалить RR',
            type: ArgType.SUB_COMMAND,
            options: [
                {
                    name: 'message_id',
                    description: 'У какого сообщения',
                    required: true,
                    type: ArgType.STRING,
                },
                {
                    name: 'channel',
                    description: 'В каком канале (по умолчанию: в этом)',
                    required: false,
                    type: ArgType.CHANNEL,
                },
            ],
        },
    ],
    defaultPermission: false,
    group: __dirname.split(/[\\/]/)[__dirname.split(/[\\/]/).length - 1],
    async execute(client: Client, interaction: CommandInteraction) {
        if (!interaction.guildId) {
            throw new Error('Не определен параметр guildId');
        }

        const message = (await interaction.deferReply({
            fetchReply: true,
        })) as Message;

        const embed = new MessageEmbed({
            color: config.settings.default.color.message,
            author: { name: this.description },
        });

        const subcommand = interaction.options.getSubcommand();
        const messageId = interaction.options.getString('message_id');
        const channel =
            (interaction.options.getChannel(
                'channel',
            ) as GuildTextBasedChannel) || interaction.channel;

        if (subcommand === 'list' && !messageId) {
            const rrOfGuild = await models.RoleReaction.getAllByGuild(
                interaction.guildId,
            );

            embed.setTitle('Список отслеживаемых сообщений');

            cooldowns.set(
                interaction.user.id,
                interaction.guildId,
                this.name,
                config.settings.default.list.timeout,
            );

            await messageEmbedWithPages(
                interaction,
                embed,
                rrOfGuild.map(
                    (rr) =>
                        `:id: \`${rr.message_id}\`: [Перейти к сообщению в <#${rr.channel_id}>](https://discord.com/channels/${rr.guild_id}/${rr.channel_id}/${rr.message_id})`,
                ),
            );

            return cooldowns.set(
                interaction.user.id,
                interaction.guildId,
                this.name,
            );
        }

        if (subcommand === 'list' && messageId) {
            const messageInChannel = await channel.messages.resolve(messageId);
            if (!messageInChannel) {
                throw new Error(
                    `сообщение ${
                        emojiCharacters.id
                    } \`${messageId}\` не найдено в канале ${channel.toString()}`,
                );
            }

            const rrOfMessage = await models.RoleReaction.getAllByMessage(
                interaction.guildId,
                channel.id,
                messageId,
            );

            embed
                .setTitle('Список RR у сообщения')
                .setURL(
                    `https://discord.com/channels/${interaction.guildId}/${channel.id}/${messageId}`,
                )
                .setDescription(
                    rrOfMessage
                        .map((rr) => `${rr.reaction} <@&${rr.role_id}>`)
                        .join('\n') || 'Нет',
                )
                .setFooter({
                    text: `${
                        emojiCharacters.id
                    } ${messageId} в ${channel.toString()}`,
                });
        }

        if (subcommand === 'set' && messageId) {
            const reaction = interaction.options.getString('reaction', true);
            const role = interaction.options.getRole('role', true);

            const setMessage = await channel.messages.fetch(messageId);

            await setMessage.react(reaction);

            await models.RoleReaction.set(
                interaction.guildId,
                channel.id,
                messageId,
                role.id,
                reaction,
            );

            embed.setDescription(
                `Реакция-роль добавлена ${emojiCharacters.yes}`,
            );
        }

        if (subcommand === 'remove' && messageId) {
            if (!interaction.guild) {
                throw new Error('Не определен параметр guild');
            }

            const rrOfMessage = await models.RoleReaction.getAllByMessage(
                interaction.guildId,
                channel.id,
                messageId,
            );

            const options = [];

            for (const rr of rrOfMessage) {
                options.push({
                    emoji: rr.reaction,
                    label:
                        (await rr.getDiscordRole(interaction.guild.roles))
                            ?.name || '???',
                    description: `🆔 ${rr.role_id}`,
                    value: rr.id.toString(),
                });
            }

            const row = new MessageActionRow().addComponents(
                new MessageSelectMenu()
                    .setCustomId('rr_remove')
                    .setPlaceholder('Ничего не выбрано')
                    .setMaxValues(rrOfMessage.length)
                    .addOptions(options),
            );

            embed.setTitle('Что удалить?');

            await interaction.editReply({
                embeds: [embed],
                components: [row],
            });

            cooldowns.set(
                interaction.user.id,
                interaction.guildId,
                this.name,
                config.settings.default.menu.timeout,
            );

            const values = await awaitSelectInMenuByUser(
                message,
                interaction.user.id,
            );

            cooldowns.set(interaction.user.id, interaction.guildId, this.name);

            await models.RoleReaction.destroy({ where: { id: values } });

            embed.setDescription(`Удалено: ${values.join(', ')}`);
        }

        return await interaction.editReply({
            embeds: [embed],
            components: [],
        });
    },
};
