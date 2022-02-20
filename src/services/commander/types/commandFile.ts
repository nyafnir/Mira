import {
    CommandInteraction,
    CommandInteractionOption,
    ApplicationCommandPermissionData,
    ApplicationCommandOptionChoice,
    Client,
} from 'discord.js';

// Application Command Option Type (https://discord.com/developers/docs/interactions/slash-commands#application-command-object-application-command-option-type)
export enum ArgType {
    SUB_COMMAND = 1,
    SUB_COMMAND_GROUP = 2, // https://discord.com/developers/docs/interactions/application-commands#subcommands-and-subcommand-groups
    STRING = 3,
    INTEGER = 4, // Любое целое между -2^53 и 2^53
    BOOLEAN = 5,
    USER = 6,
    CHANNEL = 7, // Все типы каналов и категорий
    ROLE = 8,
    MENTIONABLE = 9, // Пользователи и роли
    NUMBER = 10, // Любое десятичное между -2^53 и 2^53
}

export class BotCommand {
    name!: string; // Имя команды
    description?: string; // Описание
    usage?: string; // Пример использования
    options: {
        name: string;
        description: string;
        required: boolean;
        type: ArgType;
        choices: ApplicationCommandOptionChoice[];
    }[] = []; // Подкоманды
    cooldown?: {
        messages?: string[];
        seconds?: number;
    }; // Время отката
    group = 'Без группы';
    defaultPermission = true; // Разрешить использовать команду всем
    permissions?: ApplicationCommandPermissionData[];
    execute(
        client: Client,
        interaction: CommandInteraction,
        options?: CommandInteractionOption[],
    ): void | Promise<void> {
        throw new Error(
            `Вызвана пустая команда с client=${client} interaction=${interaction} options=${options}.`,
        );
    }
}
