import { Client, CommandInteraction, Message } from 'discord.js';
import { config } from '@config';

module.exports = {
    name: __filename.slice(__dirname.length + 1).split('.')[0],
    description: 'Проверка связи',
    cooldown: {
        seconds: 3,
    },
    group: __dirname.split(/[\\/]/)[__dirname.split(/[\\/]/).length - 1],
    async execute(client: Client, interaction: CommandInteraction) {
        const sent = (await interaction.reply({
            content: 'Проверка связи.. :ping_pong:',
            fetchReply: true,
        })) as Message;

        const ping = sent.createdTimestamp - interaction.createdTimestamp;

        return await sent.edit({
            embeds: [
                {
                    color:
                        ping + client.ws.ping < 1000
                            ? config.settings.default.color.success
                            : config.settings.default.color.warning,
                    description:
                        `Задержка: ${ping} мс` +
                        `\nWebSocket: ${Math.round(client.ws.ping)} мс`,
                },
            ],
        });
    },
};
