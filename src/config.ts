// eslint-disable-next-line @typescript-eslint/no-var-requires
const pj = require('../package.json');
import { Dialect } from 'sequelize';
import { ColorResolvable } from 'discord.js';
import { config as dotenv } from 'dotenv';

const dotenvParsed = dotenv().parsed || {};

export const config = {
    bot: {
        name: pj.name,
        version: pj.version,
        dependencies: {
            nodejs: process.version,
            discordjs: pj.dependencies['discord.js'],
        },
        bugs: pj.bugs,
        token: dotenvParsed.BOT_TOKEN,
        author: {
            nickname: pj.author,
            discord: {
                id: '197999736035344384',
                tag: pj.author + '#9896',
            },
        },
        guildId: dotenvParsed.GUILD_ID || null, // Используется для режима разработки
    },
    discord: {
        embed: {
            title: 256,
            description: 4096,
            field: {
                count: 25,
                name: 256,
                value: 1024,
            },
            footer: 2048,
            author: {
                name: 256,
            },
            maximalPerMessage: 10,
            sumAllCharacters: 6000,
        }, // https://discordjs.guide/popular-topics/embeds.html#embed-limits
        emoji: {
            name: {
                size: 32,
            },
        },
        voice: {
            size: {
                minimal: 0,
                maximal: 99,
            },
        },
        channel: {
            count: 255,
        },
        menu: {
            choice: {
                max: 25,
            },
        },
    },
    database: {
        user: dotenvParsed.DB_USER,
        password: dotenvParsed.DB_PASSWORD,
        name: pj.name,
        host: dotenvParsed.DB_HOST,
        port: +dotenvParsed.DB_PORT,
        options: {
            ssl: false,
            pool: {
                max: 10,
                min: 0,
                idle: 10000,
                acquire: 60000,
                evict: 1000,
            },
            retry: {
                match: [
                    /ETIMEDOUT/,
                    /EHOSTUNREACH/,
                    /ECONNRESET/,
                    /ECONNREFUSED/,
                    /ETIMEDOUT/,
                    /ESOCKETTIMEDOUT/,
                    /EHOSTUNREACH/,
                    /EPIPE/,
                    /EAI_AGAIN/,
                    /SequelizeConnectionError/,
                    /SequelizeConnectionRefusedError/,
                    /SequelizeHostNotFoundError/,
                    /SequelizeHostNotReachableError/,
                    /SequelizeInvalidConnectionError/,
                    /SequelizeConnectionTimedOutError/,
                ],
                max: 5,
            },
            dialect: dotenvParsed.DB_DIALECT as Dialect,
            define: {
                timestamps: true,
                charset: 'utf8mb4',
                collate: 'utf8mb4_0900_as_cs',
            },
            logging: false,
            sync: {
                alter: true, // Обновить, если не совпадают с локальными моделями
                force: false, // Принудительное пересоздание таблиц
            },
        },
    },
    settings: {
        default: {
            color: {
                message: '#0099FF' as ColorResolvable,
                danger: '#CE5151' as ColorResolvable,
                warning: '#E8EC2F' as ColorResolvable,
                success: '#67BD52' as ColorResolvable,
            },
            menu: {
                timeout: 15000,
            },
            button: {
                timeout: 15000,
            },
            list: {
                size: 10,
                timeout: 15000,
            },
            cooldown: {
                seconds: 1,
                messages: [
                    'я не в настроении что-либо говорить (timeLeft)',
                    'пожалуйста, подожди timeLeft прежде, чем снова вызвать эту команду',
                    'ещё timeLeft и ты сможешь воспользоваться этой командой',
                ],
            },
        },
        commands: {
            donate: {
                color: '#4CD137' as ColorResolvable,
            },
            info: {
                status: {
                    color: '#2CB0DE' as ColorResolvable,
                },
            },
            help: {
                color: '#7B2C5E' as ColorResolvable,
            },
        },
    },
};
