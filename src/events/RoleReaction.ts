import {
    MessageReaction,
    PartialMessageReaction,
    PartialUser,
    User,
} from 'discord.js';
import { getDiscordGuildMember } from '@utils';
import { models } from '@services/database';

export const onMessageReaction = async (
    reaction: MessageReaction | PartialMessageReaction,
    user: User | PartialUser,
    isAdd: boolean,
): Promise<void> => {
    if (reaction.message.guild === null) {
        return;
    }

    // When a reaction is received, check if the structure is partial
    if (reaction.partial) {
        // If the message this reaction belongs to was removed, the fetching might result in an API error which should be handled
        try {
            await reaction.fetch();
        } catch {
            // Return as `reaction.message.author` may be undefined/null
            return;
        }
    }

    const emoji = reaction.emoji.toString();

    const instance = await models.RoleReaction.getOneByReaction(
        reaction.message.guild.id,
        reaction.message.channelId,
        reaction.message.id,
        emoji,
    );

    if (!instance) {
        return;
    }

    const guildMember = await getDiscordGuildMember(
        user.id,
        reaction.message.guild,
    );

    if (!guildMember || !guildMember.roles) {
        return;
    }

    try {
        if (isAdd) {
            await guildMember.roles.add(instance.role_id);
        } else {
            await guildMember.roles.remove(instance.role_id);
        }
    } catch {
        await Promise.all([
            reaction.message.channel
                .send(
                    `Не удалось ${
                        isAdd ? 'выдать' : 'снять'
                    } роль по реакции ${emoji}, скорее всего у меня недостаточно прав. Реакция-роль удалена.`,
                )
                .catch(/* НЕ МОЖЕМ SEND_MESSAGES */),
            instance.destroy().catch(/* УЖЕ УДАЛИЛИ В ДРУГОМ ВЫЗОВЕ */),
        ]);
    }
};
