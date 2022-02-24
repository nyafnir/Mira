import { Client, CommandInteraction, MessageEmbed } from 'discord.js';
import { convertMsToDHMS, roundDecimalPlaces } from '@utils';
import { config } from '@config';
import { ArgType } from '@services/commander';
import { cpuUsage } from 'os-utils';

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
            description: 'Выразить благодарность за хорошего бота',
            type: ArgType.SUB_COMMAND,
        },
    ],
    group: __dirname.split(/[\\/]/)[__dirname.split(/[\\/]/).length - 1],
    async execute(client: Client, interaction: CommandInteraction) {
        const subcommand = interaction.options.getSubcommand(true);

        return await interaction.reply({
            embeds: [
                subcommand === 'info'
                    ? await getEmbedBotInfo(client, interaction)
                    : embedDonateInfo,
            ],
            ephemeral: subcommand === 'donate',
        });
    },
};

const getEmbedBotInfo = async (
    client: Client,
    interaction: CommandInteraction,
) => {
    const cpu: number =
        (await new Promise((resolve) =>
            cpuUsage((percentage) => resolve(percentage)),
        )) || -1;

    return new MessageEmbed()
        .setColor(config.settings.commands.mira.info.color)
        .setTitle('Информация обо мне')
        .setThumbnail(
            interaction.client.user?.avatarURL({ dynamic: true }) || '',
        )
        .setFields([
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
                    '/' +
                    roundDecimalPlaces(process.memoryUsage().rss / 8e6, 0) +
                    ' МБ'
                }\`\nЦП: \`${cpu.toFixed(2)}%\``,
                inline: true,
            },
            {
                name: 'Статистика',
                value: `Версия: [${config.bot.version}](${
                    config.bot.homepage
                }) | Сервера: **${client.guilds.cache.size.toString()}**`,
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
            text: `Время работы: ${convertMsToDHMS(
                client.uptime || 0,
            ).toString()}`,
        });
};

const embedDonateInfo = new MessageEmbed()
    .setColor(config.settings.commands.mira.donate.color)
    .setTitle('Благодарность за хорошего бота')
    .setFields([
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
    .setImage(config.settings.commands.mira.donate.image)
    .setFooter({
        text: config.settings.commands.mira.donate.footer,
    });
