import { Client, CommandInteraction } from 'discord.js';
import { ArgType } from '@services/commander';
import { config } from '@config';
import { chance } from '@utils';

module.exports = {
    name: __filename.slice(__dirname.length + 1).split('.')[0],
    description: 'Бросить кубики',
    usage: '[максимальное значение]',
    options: [
        {
            name: 'max',
            description: 'Максимальное значение',
            required: false,
            type: ArgType.INTEGER,
        },
    ],
    group: __dirname.split(/[\\/]/)[__dirname.split(/[\\/]/).length - 1],
    async execute(client: Client, interaction: CommandInteraction) {
        const max = interaction.options.getInteger('max') || 100;

        return await interaction.reply({
            embeds: [
                {
                    color: config.settings.default.color.message,
                    title: `${chance.integer({ min: 0, max })} из ${max}`,
                    author: {
                        name: 'Бросаю виртуальные кубики и выпадает ...',
                    },
                },
            ],
        });
    },
};
