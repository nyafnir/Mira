import { Model, DataTypes, Sequelize } from 'sequelize';
import { Command } from './Command';
import { Guild as DiscordGuild } from 'discord.js';
import {
    getDiscordGuild,
    getDiscordGuildMember,
    getDiscordRole,
    groupObjectsByKey,
} from '@utils';

interface IPermissionAttributes {
    id?: number; // Локальный идентификатор
    command_id: string; // Id команды к котором относится разрешение
    guild_id: string; // Сервер на котором реализуется разрешение
    type: string; // Цель разрешения
    discord_id: string; // Id цели разрешения
    permission: boolean; // Разрешено или запрещено
}

interface IBulkDestroyOptions {
    where: {
        id: string[];
    };
    hooks: boolean;
    individualHooks: boolean;
    force: boolean;
    cascade: boolean;
    restartIdentity: boolean;
    type: 'BULKDELETE';
    model: Permission;
}

export class Permission
    extends Model<IPermissionAttributes>
    implements IPermissionAttributes
{
    //#region Атрибуты

    readonly id!: number;
    readonly command_id!: string;
    readonly guild_id!: string;
    readonly type!: 'USER' | 'ROLE';
    readonly discord_id!: string;
    permission!: boolean;

    //#endregion

    //#region Отметки времени

    readonly created_at!: Date;
    readonly updated_at!: Date | null;
    readonly deleted_at!: Date | null;

    //#endregion

    //#region Базовые методы класса

    static initialize = (sequelize: Sequelize) =>
        Permission.init(
            {
                id: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    primaryKey: true,
                    autoIncrement: true,
                },
                command_id: {
                    type: DataTypes.STRING,
                    allowNull: false,
                },
                guild_id: {
                    type: DataTypes.STRING,
                    allowNull: false,
                },
                type: {
                    type: DataTypes.STRING,
                    allowNull: false,
                },
                discord_id: {
                    type: DataTypes.STRING,
                    allowNull: false,
                },
                permission: {
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                },
            },
            {
                sequelize,
                paranoid: false,
                timestamps: true,
                underscored: true,
            },
        );

    static associate = () => {
        Permission.belongsTo(Command);

        Permission.beforeCreate(syncPermissionWithDiscord);
        Permission.beforeUpdate(syncPermissionWithDiscord);

        Permission.beforeBulkCreate(async (instances: Permission[]) => {
            // 0 - нет случая вставки прав для разных гильдий одновременно
            const guild = await getDiscordGuild(instances[0].guild_id);
            if (!guild) {
                throw new Error(
                    `Гильдия ID: ${instances[0].guild_id} недоступна, создание группы разрешений отменено.`,
                );
            }

            const groups = groupObjectsByKey(instances, 'command_id');

            const fullPermissions = groups.map((group) => {
                return {
                    id: group.key,
                    permissions: group.values.map((data: Permission) => {
                        return {
                            id: data.discord_id,
                            type: data.type,
                            permission: data.permission,
                        };
                    }),
                };
            });

            await guild.commands.permissions.set({
                fullPermissions,
            });
        });

        Permission.beforeDestroy(async (instance: Permission) => {
            const guild = await getDiscordGuild(instance.guild_id);

            if (!guild) {
                throw new Error(
                    `Гильдия ID: ${instance.guild_id} недоступна, удаление разрешения отменено.`,
                );
            }

            await guild.commands.permissions.remove({
                command: instance.command_id,
                users: instance.type === 'USER' ? instance.discord_id : [],
                roles:
                    instance.type === 'ROLE' ? instance.discord_id : undefined,
            });
        });

        Permission.beforeBulkDestroy(
            async (options: Partial<IBulkDestroyOptions>) => {
                const ids = options.where?.id || [];

                const instances: Permission[] = [];
                for (const _id of ids) {
                    const instance = await Permission.findByPk(_id);
                    if (instance) {
                        instances.push(instance);
                    }
                }

                // 0 - в боте нет случая удаления прав для разных гильдий одновременно
                const guildId = instances[0].guild_id;
                const guild = await getDiscordGuild(guildId);
                if (!guild) {
                    throw new Error(
                        `гильдия ID: ${guildId} недоступна, удаление настройки невозможно.`,
                    );
                }

                const groupByCommandId = groupObjectsByKey(
                    instances,
                    'command_id',
                );

                for (const group of groupByCommandId) {
                    const users = [];
                    const roles = [];
                    for (const data of group.values) {
                        if (data.type === 'USER') {
                            users.push(data.discord_id);
                        } else if (data.type === 'ROLE') {
                            roles.push(data.discord_id);
                        }
                    }

                    await guild.commands.permissions.remove({
                        command: group.key,
                        users,
                        roles,
                    });
                }
            },
        );
    };

    //#endregion

    //#region Методы класса

    static getAllByGuild = async (guild_id: string): Promise<Permission[]> =>
        Permission.findAll({
            where: {
                guild_id,
            },
        });

    static getAllByCommandId = async (
        guild_id: string,
        command_id: string,
    ): Promise<Permission[]> =>
        Permission.findAll({
            where: {
                guild_id,
                command_id,
            },
        });

    static setOne = async (
        permissionAttributes: IPermissionAttributes,
    ): Promise<Permission> => {
        const [instance, isCreated] = await Permission.findOrCreate({
            where: {
                command_id: permissionAttributes.command_id,
                guild_id: permissionAttributes.guild_id,
                type: permissionAttributes.type,
                discord_id: permissionAttributes.discord_id,
            },
            defaults: permissionAttributes,
        });

        if (isCreated === false) {
            if (instance.permission === permissionAttributes.permission) {
                throw new Error('такое разрешение уже установлено.');
            }
            return await instance.update({
                permission: permissionAttributes.permission,
            });
        }

        return instance;
    };

    //#endregion

    //#region Методы объекта

    getDiscordObjectName = async (
        guild: DiscordGuild,
    ): Promise<string | null> => {
        if (this.type === 'USER') {
            return (
                (await getDiscordGuildMember(this.discord_id, guild))
                    ?.displayName || null
            );
        } else if (this.type === 'ROLE') {
            return (await getDiscordRole(this.discord_id, guild))?.name || null;
        }

        return null;
    };

    //#endregion
}

const syncPermissionWithDiscord = async (instance: Permission) => {
    const guild = await getDiscordGuild(instance.guild_id);
    if (guild === null) {
        throw new Error(
            `Гильдия ID: ${instance.guild_id} недоступна, изменение разрешения отменено.`,
        );
    }

    const permissions = {
        command: instance.command_id,
        permissions: [
            {
                id: instance.discord_id,
                type: instance.type,
                permission: instance.permission,
            },
        ],
    };

    await guild.commands.permissions.add(permissions);
};
