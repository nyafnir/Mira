import pino from 'pino';

const logger = pino({
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'hostname,pid',
        },
    },
});

export const log = {
    info: (message: string, details: unknown = {}): void => {
        logger.info(details, message);
    },
    warn: (message: string, details: unknown = {}): void => {
        logger.warn(details, message);
    },
    error: (message: string, details: unknown = {}): void => {
        logger.error(details, message);
    },
};
