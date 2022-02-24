import { Chance } from 'chance';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';
import errors from './errors';

// Случайные данные
export const chance = new Chance();

// Получить список путей к файлам в каталоге (рекурсивно)
export const getAllFiles = function (
    dirPath: string,
    arrayOfFiles: string[] = [],
) {
    const files = readdirSync(dirPath);

    files.forEach(function (file) {
        if (statSync(dirPath + '/' + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + '/' + file, arrayOfFiles);
        } else {
            arrayOfFiles.push(join(dirPath, '/', file));
        }
    });

    return arrayOfFiles;
};

//#region Преобразователи времени

/**
 * Преобразование миллисекунд
 * @param {number} ms Время в миллисекундах от 0
 * @return {Object} { days, hours, minutes, seconds, toString() }
 */
export const convertMsToDHMS = (ms: number) => {
    if (ms < 0) {
        throw new Error(errors.DATATIME_INVALID.description);
    }

    let totalSeconds = ms / 1000;
    const days = Math.floor(totalSeconds / 86400);
    totalSeconds %= 86400;
    const hours = Math.floor(totalSeconds / 3600);
    totalSeconds %= 3600;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.round(totalSeconds % 60);

    return {
        days,
        hours,
        minutes,
        seconds,
        /**
         * Возвращает форматированное время из полученных полей
         * @returns д? ч? мин? сек? || меньше секунды
         */
        toString: () => {
            if (ms < 1000) {
                return 'меньше секунды';
            }

            const str = [];
            if (days) {
                str.push(`${days} д`);
            }
            if (hours) {
                str.push(`${hours} ч`);
            }
            if (minutes) {
                str.push(`${minutes} мин`);
            }
            if (seconds) {
                str.push(`${seconds} сек`);
            }

            return str.join(' ');
        },
    };
};

//#endregion

//#region Преобразование данных

// Группировать объекты по ключу
export function groupObjectsByKey<
    T extends string | number | boolean | Date,
    O extends { [P in K]: T },
    K extends keyof O,
>(
    arrayObjects: O[],
    by: K,
): {
    key: O[K];
    values: O[];
}[] {
    const groups: {
        key: O[K];
        values: O[];
    }[] = [];

    for (const element of arrayObjects) {
        const groupIndex = groups.findIndex(
            (group: { key: O[K]; values: O[] }) => group.key === element[by],
        );
        if (groupIndex === -1) {
            groups.push({ key: element[by], values: [element] });
        } else {
            groups[groupIndex].values.push(element);
        }
    }

    return groups;
}

export const toTitle = (value: string): string =>
    value.toLowerCase().replace(/(?:^|\s)\S/g, (match) => match.toUpperCase());

export const roundDecimalPlaces = (value: number, decimals = 2): string => {
    const sign = value >= 0 ? 1 : -1;
    return (
        Math.round(value * 10 ** decimals + sign * 0.001) /
        10 ** decimals
    ).toFixed(decimals);
};

//#endregion
