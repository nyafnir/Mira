import { Model, DataTypes, Sequelize, Association } from 'sequelize';
import { config } from '@config';
import { Permission } from './';

interface ICommandAttributes {
    id: string; // Id присвоенный дискордом
    name: string; // Имя команды
}

export class Command
    extends Model<ICommandAttributes>
    implements ICommandAttributes
{
    //#region Атрибуты

    readonly id!: string;
    readonly name!: string;

    //#endregion

    //#region Отметки времени

    readonly created_at!: Date;
    readonly updated_at!: Date | null;
    readonly deleted_at!: Date | null;

    //#endregion

    //#region Связь с другими таблицами

    readonly permissions?: Permission[];

    static associations: {
        permissions: Association<Command, Permission>;
    };

    //#region Базовые методы класса

    static initialize = (sequelize: Sequelize) =>
        Command.init(
            {
                id: {
                    type: DataTypes.STRING,
                    allowNull: false,
                    primaryKey: true,
                },
                name: {
                    type: DataTypes.STRING,
                    allowNull: false,
                    unique: true,
                    validate: {
                        len: [2, 10], // Стандартные ограничения от sequelize
                    },
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
        Command.hasMany(Permission, {
            as: 'permissions',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        });
    };

    //#endregion

    //#region Методы класса

    static setCommands = async (
        commands: ICommandAttributes[],
        guildId: string | null = null,
        userId = config.bot.author.discord.id,
    ): Promise<Command[]> => {
        const settedCommands = await Command.bulkCreate(commands);

        if (guildId) {
            await Permission.bulkCreate(
                commands.map((command) => {
                    return {
                        command_id: command.id,
                        guild_id: guildId,
                        type: 'USER',
                        discord_id: userId,
                        permission: true,
                    };
                }),
            );
        }

        return settedCommands;
    };

    static getAll = async (withPermissions = false): Promise<Command[]> => {
        return await Command.findAll({
            include: withPermissions
                ? [Command.associations.permissions]
                : undefined,
        });
    };

    static getOne = async (
        name: string,
        withPermissions = false,
    ): Promise<Command> => {
        const command = await Command.findOne({
            where: { name },
            include: withPermissions
                ? [Command.associations.permissions]
                : undefined,
        });

        if (command === null) {
            throw new Error(`команда \`/${name}\` не найдена в базе данных.`);
        }

        return command;
    };

    //#endregion

    //#region Методы объекта

    getPermissionsFor = async (guildId: string): Promise<Permission[]> => {
        if (!this.permissions) {
            return await Permission.findAll({
                where: { guild_id: guildId, command_id: this.id },
            });
        } else {
            return this.permissions.filter(
                (permission) => permission.guild_id === guildId,
            );
        }
    };

    //#endregion
}
