import { User as DiscordUser } from 'discord.js';
import { Model, DataTypes, Sequelize, Includeable } from 'sequelize';
import { config } from '@config';
import { log } from '@services/logger';
import { getDiscordUser } from '@utils';

interface IUserAttributes {
    id: string; // ID присвоенный дискордом
    date_of_birth?: Date | null;
}

export class User extends Model<IUserAttributes> implements IUserAttributes {
    //#region Атрибуты

    readonly id!: string;
    date_of_birth: Date | null = null;

    //#endregion

    //#region Отметки времени

    readonly created_at!: Date;
    readonly updated_at!: Date;
    readonly deleted_at!: Date;

    //#endregion

    //#region Базовые методы класса

    static initialize = (sequelize: Sequelize) =>
        User.init(
            {
                id: {
                    type: DataTypes.STRING,
                    allowNull: false,
                    primaryKey: true,
                },
                date_of_birth: {
                    type: DataTypes.DATEONLY,
                    allowNull: true,
                    defaultValue: null,
                },
            },
            {
                sequelize,
                paranoid: true,
                timestamps: true,
                underscored: true,
            },
        );

    static associate = () => {
        return;
    };

    //#endregion

    //#region Методы класса

    static getOne = async (
        userId: string,
        include?: Includeable | Includeable[],
    ): Promise<User> => {
        const [instance] = await User.findOrCreate({
            where: {
                id: userId,
            },
            include,
        });
        return instance;
    };

    //#endregion

    //#region Методы объекта

    getAge = (): number | null => {
        if (this.date_of_birth === null) {
            return null;
        }

        const ms = new Date(this.date_of_birth).getTime();

        const age = new Date(Date.now() - ms).getFullYear() - 1970;

        return age;
    };

    getAgeFormatted = (): string => {
        const age = this.getAge();

        if (age === null) {
            return 'дата рождения не установлена';
        }

        if (age % 10 == 1 && age != 11) {
            return `${age} год`;
        } else if (
            age % 10 >= 2 &&
            age % 10 <= 4 &&
            age != 12 &&
            age != 13 &&
            age != 14
        ) {
            return `${age} года`;
        } else {
            return `${age} лет`;
        }
    };

    celebrateBirthday = async (
        discordUser?: DiscordUser | null,
    ): Promise<boolean> => {
        discordUser = discordUser || (await getDiscordUser(this.id));

        if (discordUser === null) {
            return false;
        }

        log.info(
            `[Celebrate Birthday] Поздравляю ${discordUser.username} с днём рождения!`,
        );

        return await discordUser
            .send({
                embeds: [
                    {
                        color: config.settings.default.color.danger,
                        title: 'С днём рождения!',
                        image: {
                            url: 'https://media1.tenor.com/images/9509d670db26a9eacc317b751a3fbb38/tenor.gif',
                        },
                        footer: {
                            text: this.getAgeFormatted(),
                        },
                    },
                ],
            })
            .then(() => {
                return true;
            })
            .catch((reason) => {
                log.warn(
                    `[Celebrate Birthday] Не удалось поздравить, причина:`,
                    reason,
                );
                return false;
            });
    };

    //#endregion
}
