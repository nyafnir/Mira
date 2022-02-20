import { Role, RoleManager } from 'discord.js';
import { Model, DataTypes, Sequelize } from 'sequelize';

interface IRoleReactionAttributes {
    id?: number;
    guild_id: string;
    channel_id: string;
    message_id: string;
    role_id: string;
    reaction: string;
}

export class RoleReaction
    extends Model<IRoleReactionAttributes>
    implements IRoleReactionAttributes
{
    //#region Атрибуты

    readonly id!: number;
    readonly guild_id!: string;
    readonly channel_id!: string;
    readonly message_id!: string;
    role_id!: string;
    readonly reaction!: string;

    //#endregion

    //#region Базовые методы класса

    static initialize = (sequelize: Sequelize) =>
        RoleReaction.init(
            {
                id: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    primaryKey: true,
                    autoIncrement: true,
                },
                guild_id: {
                    type: DataTypes.STRING(191),
                    allowNull: false,
                    unique: 'discord_cannot_have_duplicate_reactions',
                },
                channel_id: {
                    type: DataTypes.STRING(191),
                    allowNull: false,
                    unique: 'discord_cannot_have_duplicate_reactions',
                },
                message_id: {
                    type: DataTypes.STRING(191),
                    allowNull: false,
                    unique: 'discord_cannot_have_duplicate_reactions',
                },
                role_id: {
                    type: DataTypes.STRING(191),
                    allowNull: false,
                },
                reaction: {
                    type: DataTypes.STRING(191),
                    allowNull: false,
                    unique: 'discord_cannot_have_duplicate_reactions',
                },
            },
            {
                sequelize,
                paranoid: false,
                timestamps: false,
                underscored: true,
            },
        );

    static associate = () => {
        return;
    };

    //#endregion

    //#region Методы класса

    static getAllByGuild = async (guildId: string): Promise<RoleReaction[]> =>
        RoleReaction.findAll({
            where: {
                guild_id: guildId,
            },
        });

    static getAllByMessage = async (
        guildId: string,
        сhannelId: string,
        messageId: string,
    ): Promise<RoleReaction[]> =>
        RoleReaction.findAll({
            where: {
                guild_id: guildId,
                channel_id: сhannelId,
                message_id: messageId,
            },
        });

    static getOneByReaction = async (
        guildId: string,
        сhannelId: string,
        messageId: string,
        reaction: string,
    ): Promise<RoleReaction | null> =>
        RoleReaction.findOne({
            where: {
                guild_id: guildId,
                channel_id: сhannelId,
                message_id: messageId,
                reaction,
            },
        });

    static set = async (
        guildId: string,
        сhannelId: string,
        messageId: string,
        roleId: string,
        reaction: string,
    ): Promise<RoleReaction> => {
        const [rr] = await RoleReaction.upsert({
            guild_id: guildId,
            channel_id: сhannelId,
            message_id: messageId,
            role_id: roleId,
            reaction,
        });
        return rr;
    };

    //#endregion

    //#region Методы объекта

    getDiscordRole = async (roles: RoleManager): Promise<Role | null> => {
        return (
            roles.cache.get(this.role_id) ||
            roles.resolve(this.role_id) ||
            (await roles.fetch(this.role_id))
        );
    };

    //#endregion
}
