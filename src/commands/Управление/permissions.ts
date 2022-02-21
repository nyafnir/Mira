import {
    Client,
    CommandInteraction,
    Message,
    MessageActionRow,
    MessageEmbed,
    MessageSelectMenu,
    Role,
    User,
} from 'discord.js';
import { ArgType } from '@services/commander';
import { models } from '@services/database';
import { config } from '@config';
import { cooldowns } from '@services/cooldowner';
import {
    awaitSelectInMenuByUser,
    checkPermissionsForDiscordGuildMember,
    messageEmbedWithPages,
    emojiCharacters,
} from '@utils';

module.exports = {
    name: __filename.slice(__dirname.length + 1).split('.')[0],
    description: 'Настройки доступа к командам',
    usage: '[list / set / remove]',
    options: [
        {
            name: 'list',
            description: 'Список настроенных команд',
            type: ArgType.SUB_COMMAND,
            options: [
                {
                    name: 'command_name',
                    description: 'Имя команды',
                    required: false,
                    type: ArgType.STRING,
                },
            ],
        },
        {
            name: 'set',
            description: 'Настроить доступ к команде',
            type: ArgType.SUB_COMMAND,
            options: [
                {
                    name: 'command_name',
                    description: 'Имя команды',
                    required: true,
                    type: ArgType.STRING,
                },
                {
                    name: 'user_or_role',
                    description: 'Пользователь или роль',
                    required: true,
                    type: ArgType.MENTIONABLE,
                },
                {
                    name: 'permission',
                    description: 'Разрешить или запретить',
                    required: true,
                    type: ArgType.BOOLEAN,
                },
            ],
        },
        {
            name: 'remove',
            description: 'Удалить настройки',
            type: ArgType.SUB_COMMAND,
            options: [
                {
                    name: 'command_name',
                    description: 'Имя команды',
                    required: true,
                    type: ArgType.STRING,
                },
            ],
        },
    ],
    defaultPermission: true,
    group: __dirname.split(/[\\/]/)[__dirname.split(/[\\/]/).length - 1],
    async execute(client: Client, interaction: CommandInteraction) {
        if (!interaction.guild || !interaction.guildId) {
            throw new Error('Не определен параметр guild/guildId');
        }

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'set' || subcommand === 'remove') {
            if (!interaction.member) {
                throw new Error('Не определен interaction.member');
            }

            checkPermissionsForDiscordGuildMember(
                interaction.member.permissions,
            );
        }

        const message = (await interaction.deferReply({
            fetchReply: true,
        })) as Message;

        const embed = new MessageEmbed({
            color: config.settings.default.color.message,
            author: { name: this.description },
        });

        const commandName = interaction.options.getString('command_name');

        if (subcommand === 'list' && !commandName) {
            const commands = await models.Command.getAll(true);

            const list = [];

            for (const command of commands) {
                list.push(
                    `/**${command.name}** (${
                        (await command.getPermissionsFor(interaction.guildId))
                            .length
                    })`,
                );
            }

            embed.setTitle('Команда (количество настроек)');

            cooldowns.set(
                interaction.user.id,
                interaction.guildId,
                this.name,
                config.settings.default.list.timeout,
            );

            await messageEmbedWithPages(interaction, embed, list);

            return cooldowns.set(
                interaction.user.id,
                interaction.guildId,
                this.name,
            );
        }

        if (subcommand === 'list' && commandName) {
            const command = await models.Command.getOne(commandName, true);

            const permissions = await command.getPermissionsFor(
                interaction.guildId,
            );

            if (!permissions.length) {
                throw new Error(
                    `у команды \`/${commandName}\` нет настроек для отображения.`,
                );
            }

            embed.setTitle(`/${commandName}`).setFooter({
                text: 'Важно: разрешения пользователей приоритетней, чем ролей!',
            });

            cooldowns.set(
                interaction.user.id,
                interaction.guildId,
                this.name,
                config.settings.default.list.timeout,
            );

            await messageEmbedWithPages(
                interaction,
                embed,
                permissions.map(
                    (permission) =>
                        `${
                            permission.type === 'ROLE' ? 'Роль' : 'Пользователь'
                        } <${permission.type === 'ROLE' ? '@&' : '@'}${
                            permission.discord_id
                        }> ${
                            permission.permission
                                ? emojiCharacters.yes
                                : emojiCharacters.no
                        } ${emojiCharacters.id} ${permission.discord_id}`,
                ),
            );

            return cooldowns.set(
                interaction.user.id,
                interaction.guildId,
                this.name,
            );
        }

        if (subcommand === 'set' && commandName) {
            const userOrRole = interaction.options.getMentionable(
                'user_or_role',
                true,
            ) as Role | User;

            const type = userOrRole instanceof Role ? 'ROLE' : 'USER';

            const permission = interaction.options.getBoolean(
                'permission',
                true,
            );

            const command = await models.Command.getOne(commandName, false);

            await models.Permission.setOne({
                command_id: command.id,
                guild_id: interaction.guildId,
                type,
                discord_id: userOrRole.id,
                permission,
            });

            embed.setDescription(
                `К команде \`/${commandName}\` сущности ${userOrRole} доступ ${
                    permission ? 'разрешён' : 'запрещён'
                }`,
            );
        }

        if (subcommand === 'remove' && commandName) {
            const command = await models.Command.getOne(commandName, true);

            const permissions = (
                await command.getPermissionsFor(interaction.guildId)
            ).slice(0, config.discord.menu.choice.max);

            if (!permissions.length) {
                throw new Error(
                    `у команды \`/${commandName}\` нет настроек для удаления.`,
                );
            }

            const options = [];

            for (const permission of permissions) {
                options.push({
                    label: `${
                        (await permission.getDiscordObjectName(
                            interaction.guild,
                        )) || '???'
                    } ${
                        permission.permission
                            ? emojiCharacters.yes
                            : emojiCharacters.no
                    }`,
                    description: `${emojiCharacters.id} ${permission.discord_id}`,
                    value: permission.id.toString(),
                });
            }

            const row = new MessageActionRow().addComponents(
                new MessageSelectMenu()
                    .setCustomId('permissions_remove')
                    .setPlaceholder('Ничего не выбрано')
                    .setMaxValues(permissions.length)
                    .addOptions(options),
            );

            embed.setTitle('Что удалить?').setDescription(`/${commandName}`);

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

            await models.Permission.destroy({
                where: { id: values },
            });

            cooldowns.set(interaction.user.id, interaction.guildId, this.name);

            embed
                .setTitle(`/${commandName}`)
                .setDescription(
                    `Выбранные настройки доступа успешно удалены (${values.length})`,
                );
        }

        return await interaction.editReply({
            embeds: [embed],
            components: [],
        });
    },
};
