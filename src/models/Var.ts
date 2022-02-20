import { Model, DataTypes, Sequelize } from 'sequelize';

interface IVarAttributes {
    id?: number;
    guild_id: string;
    key: string;
    value: string;
}

export class Var extends Model<IVarAttributes> implements IVarAttributes {
    //#region Атрибуты

    readonly id!: number;
    readonly guild_id!: string;
    key!: string;
    value!: string;

    //#endregion

    //#region Отметки времени

    readonly created_at!: Date;
    readonly updated_at!: Date;
    readonly deleted_at!: Date;

    //#endregion

    //#region Базовые методы класса

    static initialize = (sequelize: Sequelize) =>
        Var.init(
            {
                id: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    primaryKey: true,
                    autoIncrement: true,
                },
                guild_id: {
                    type: DataTypes.STRING,
                    allowNull: false,
                },
                key: {
                    type: DataTypes.STRING,
                    allowNull: false,
                },
                value: {
                    type: DataTypes.STRING,
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
        return;
    };

    //#endregion
}
