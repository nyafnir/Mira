import { Client, CommandInteraction, MessageEmbed } from 'discord.js';
import { timeFomattedDHMS, roundDecimalPlaces } from '@utils';
import { config } from '@config';
import { ArgType } from '@services/commander';
import { cpus } from 'os';

const ncpu = cpus().length;
let previousTime = new Date().getTime();
let previousUsage = process.cpuUsage();
let lastUsage = {
    system: -1,
    total: -1,
    user: -1,
};

// @daniele-ricci https://stackoverflow.com/a/63331219/9063899
setInterval(() => {
    const currentUsage = process.cpuUsage(previousUsage);
    previousUsage = process.cpuUsage();

    const currentTime = new Date().getTime();
    const timeDelta = (currentTime - previousTime) * ncpu;
    const { user, system } = currentUsage;

    lastUsage = {
        system: system / timeDelta,
        total: (system + user) / timeDelta,
        user: user / timeDelta,
    };
    previousTime = currentTime;
}, 1000);

module.exports = {
    name: __filename.slice(__dirname.length + 1).split('.')[0],
    description: `О боте`,
    usage: '[info / donate]',
    options: [
        {
            name: 'info',
            description: 'Узнать больше',
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
                .addFields([
                    {
                        name: 'Окружение',
                        value: `NodeJS: \`${config.bot.dependencies.nodejs}\`\nDiscordJS: \`${config.bot.dependencies.discordjs}\``,
                        inline: true,
                    },
                    {
                        name: 'Ресурсы',
                        value: `ОЗУ: \`${
                            roundDecimalPlaces(
                                process.memoryUsage().heapUsed / 8e6,
                                0,
                            ) +
                            ' / ' +
                            roundDecimalPlaces(
                                process.memoryUsage().rss / 8e6,
                                0,
                            ) +
                            ' МБ'
                        }\`\nЦП: \`${lastUsage.total}\``,
                        inline: true,
                    },
                    {
                        name: 'Статистика',
                        value: `Сервера: **${client.guilds.cache.size.toString()}** Версия: [v${
                            config.bot.version
                        }](${config.bot.homepage})`,
                        inline: false,
                    },
                    {
                        name: 'Ссылки',
                        value:
                            `[Сообщить о проблеме / получить помощь](${config.bot.bugs.url})\n` +
                            `[Список изменений](${config.bot.changelog.url})`,
                        inline: false,
                    },
                ])
                .setFooter({
                    text: `Время работы: ${timeFomattedDHMS(
                        client.uptime || 0,
                    )}`,
                });
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
