require('module-alias/register');

import { initDatabase, destroyDatabase } from '@services/database';
import { initClient, destroyClient } from '@services/client';
import { initCommands } from '@services/commander';
import { log } from '@services/logger';
import { config } from '@config';

(async () => {
    log.info(`Синхронизация с базой данных ...`);
    await initDatabase();

    log.info('Подключение к дискорду ...');
    const client = await initClient();

    log.info('Загрузка команд ...');
    await initCommands(client, config.bot.guildId);

    log.info('Загрузка завершена.');
})();

const shutdown = async (): Promise<void> => {
    try {
        if (destroyClient()) {
            log.warn('Отключена от дискорда');
        }

        if (await destroyDatabase()) {
            log.warn('Отключена от базы данных');
        }
    } catch {
        process.exitCode = 1;
    }

    process.exitCode = 0;
};

//#region Ловим события смерти и пытаемся корректно завершить работу

process.on('SIGTERM', async (): Promise<void> => {
    log.warn('Отправлен SIGTERM от какого-то процесса извне!');

    return await shutdown();
});

process.on('SIGINT', async (): Promise<void> => {
    log.warn('Отправлен SIGINT (Ctrl + C)!');

    return await shutdown();
});

process.on('uncaughtException', async (error): Promise<void> => {
    log.error(error.name, error.message);

    return await shutdown();
});

//#endregion
