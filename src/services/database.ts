import { Sequelize } from 'sequelize';
import { config } from '@config';
import { User, RoleReaction, Command, Permission, Var } from '@models';

export let sequelize: Sequelize;
export let models: {
    Command: typeof Command;
    Permission: typeof Permission;
    User: typeof User;
    RoleReaction: typeof RoleReaction;
    Var: typeof Var;
};

export const initDatabase = async () => {
    if (sequelize !== undefined) {
        throw new Error('База данных уже была инициализирована.');
    }

    sequelize = new Sequelize(
        config.database.name,
        config.database.user,
        config.database.password,
        Object.assign({}, config.database.options, {
            host: config.database.host,
            port: config.database.port,
        }),
    );

    models = {
        Command: Command.initialize(sequelize),
        Permission: Permission.initialize(sequelize),
        User: User.initialize(sequelize),
        RoleReaction: RoleReaction.initialize(sequelize),
        Var: Var.initialize(sequelize),
    };

    const valueModels = Object.values(models);
    for await (const model of valueModels) {
        model.associate();
    }

    return await sequelize.sync(config.database.options.sync);
};

export const destroyDatabase = async (): Promise<boolean> => {
    if (!sequelize) {
        return false;
    }

    await sequelize.close();

    return true;
};
