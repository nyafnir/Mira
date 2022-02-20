import { Client, CommandInteraction, MessageEmbed } from 'discord.js';
import { timeFomattedDHMS, roundDecimalPlaces } from '@utils';
import { config } from '@config';
import { ArgType } from '@services/commander';

module.exports = {
    name: __filename.slice(__dirname.length + 1).split('.')[0],
    description: `О боте`,
    usage: '[info / invite / donate]',
    options: [
        {
            name: 'info',
            description: 'Узнать больше',
            type: ArgType.SUB_COMMAND,
        },
        {
            name: 'invite',
            description: 'Пригласить к себе',
            type: ArgType.SUB_COMMAND,
        },
        {
            name: 'donate',
            description: 'Благодарность за хорошего бота',
            type: ArgType.SUB_COMMAND,
        },
    ],
    group: __dirname.split(/[\\/]/)[__dirname.split(/[\\/]/).length - 1],
    async execute(client: Client, interaction: CommandInteraction) {
        const embed = new MessageEmbed();

        const subcommand = interaction.options.getSubcommand(true);

        let isEphemeral = true;

        if (subcommand === 'info') {
            isEphemeral = false;

            embed
                .setColor(config.settings.commands.info.status.color)
                .setTitle('Информация обо мне')
                .setThumbnail(
                    interaction.client.user?.avatarURL({ dynamic: true }) || '',
                )
                .setDescription(
                    `[Сообщить о проблеме / получить помощь](${config.bot.bugs.url})`,
                )
                .addFields([
                    {
                        name: '💫',
                        value: '💫',
                        inline: true,
                    },
                    {
                        name: 'Время работы',
                        value: timeFomattedDHMS(client.uptime || 0),
                        inline: true,
                    },
                    {
                        name: 'Версия',
                        value: `[${config.bot.version}](https://github.com/${config.bot.author.nickname}/${config.bot.name})`,
                        inline: true,
                    },
                    {
                        name: 'Сервера',
                        value: client.guilds.cache.size.toString(),
                        inline: true,
                    },
                    {
                        name: 'Занято ОЗУ',
                        value:
                            roundDecimalPlaces(
                                process.memoryUsage().heapUsed / 8e6,
                                0,
                            ) +
                            ' / ' +
                            roundDecimalPlaces(
                                process.memoryUsage().rss / 8e6,
                                0,
                            ) +
                            ' МБ',
                        inline: true,
                    },
                    {
                        name: 'Автор',
                        value: config.bot.author.nickname,
                        inline: true,
                    },
                ]);
        }

        if (subcommand === 'invite') {
            if (!client.user) {
                throw new Error('Не определен client.user');
            }

            embed
                .setColor(config.settings.commands.info.invite.color)
                .setAuthor({ name: 'Приглашаешь к себе?' })
                .setTitle('Да!')
                .setURL(
                    `https://discordapp.com/oauth2/authorize?client_id=${client.user.id}&scope=bot&permissions=${config.bot.permissions}`,
                )
                .setImage(
                    'https://media1.tenor.com/images/023828c4b5291432eecabdee129a1c89/tenor.gif',
                );
        }

        if (subcommand === 'donate') {
            embed
                .setColor(config.settings.commands.donate.color)
                .setTitle('Благодарность за хорошего бота')
                .addFields([
                    {
                        name: 'Юmoney',
                        value: '[410014841265118](https://yoomoney.ru/to/410014841265118)',
                        inline: true,
                    },
                    {
                        name: '💫',
                        value: '💫',
                        inline: true,
                    },
                    {
                        name: '💫',
                        value: '💫',
                        inline: true,
                    },
                ])
                .setImage(
                    'http://img.nga.178.com/attachments/mon_201911/01/-64xyuQ5-a59uXsZ7pT3cShs-a0.gif',
                )
                .setFooter({
                    text: '«Возможности не приходят сами — вы создаете их» © Крис Гроссер',
                });
        }

        return await interaction.reply({
            embeds: [embed],
            ephemeral: isEphemeral,
        });
    },
};
