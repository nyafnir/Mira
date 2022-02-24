import { Client, CommandInteraction, MessageEmbed } from 'discord.js';
import { BotCommand, ArgType, listCommands } from '@services/commander';
import { convertMsToDHMS, toTitle } from '@utils';
import { config } from '@config';

// Команды по группам
const spells: Record<string, BotCommand[]> = {};

module.exports = {
    name: __filename.slice(__dirname.length + 1).split('.')[0],
    description: 'Список заклинаний',
    usage: '[имя/категория]',
    options: [
        {
            name: 'name',
            description: 'Имя заклинания или категории заклинаний',
            required: false,
            type: ArgType.STRING,
        },
    ],
    group: __dirname.split(/[\\/]/)[__dirname.split(/[\\/]/).length - 1],
    async execute(client: Client, interaction: CommandInteraction) {
        if (!Object.keys(spells).length) {
            listCommands.map((command) => {
                if (command.permissions !== undefined) {
                    return;
                }

                if (!spells[command.group]) {
                    spells[command.group] = [command];
                } else {
                    spells[command.group].push(command);
                }
            });
        }

        const embed = new MessageEmbed({
            author: { name: '(ﾉ≧∀≦)ﾉ・‥…━━━★' },
            color: config.settings.commands.help.color,
        });

        const argument = interaction.options.getString('name');

        if (!argument) {
            // Все категории с перечислением команд (без описания)
            for await (const groupName of Object.keys(spells)) {
                embed.addField(
                    groupName,
                    spells[groupName]
                        .map((botCommand) => `\`${botCommand.name}\``)
                        .join(', ') ||
                        `Все команды категории отключены (\`/permission\`)`,
                );
            }
            embed
                .setTitle('Список заклинаний')
                .addField(
                    'Узнать больше',
                    `О категории: \`/help имя_категории\`` +
                        `\nО команде: \`/help имя_команды\``,
                );
        } else if (spells[toTitle(argument)] !== undefined) {
            // Отображение списка заклинаний из категории groupName
            const groupName = toTitle(argument);
            embed
                .setAuthor({ name: 'Заклинания категории' })
                .setTitle(groupName)
                .setDescription(
                    spells[groupName]
                        .map(
                            (spell) =>
                                `\`/${spell.name} ${spell.usage || ''}\` - ${
                                    spell.description
                                }`,
                        )
                        .join('\n'),
                )
                .setFooter({
                    text: 'Параметры обёрнутые в <> - обязательны, а в [] - нет',
                });
        } else {
            // Подробная информация о заклинании spellName
            const spellName = argument.toLowerCase();
            const spell = listCommands.get(spellName);

            if (!spell) {
                throw new Error(
                    `ни группа, ни заклинание с названием \`${argument}\` не найдены.`,
                );
            }

            embed
                .setAuthor({ name: 'О заклинании' })
                .setTitle(spell.name)
                .setDescription(spell.description || 'Описание отсутствует');

            if (spell.usage) {
                embed
                    .addField(
                        '**Колдовать так**',
                        `/${spell.name} ${spell.usage}`,
                        false,
                    )
                    .setFooter({
                        text: 'Параметры обёрнутые в <> - обязательны, а в [] - нет\n\n',
                    });
            }

            if (spell.group) {
                embed.addField('**Категория**', spell.group, true);
            }

            embed.addField(
                '**Откат**',
                convertMsToDHMS(
                    spell.cooldown?.seconds ||
                        config.settings.default.cooldown.seconds,
                ).toString(),
                true,
            );
        }

        return await interaction.reply({ embeds: [embed] });
    },
};
