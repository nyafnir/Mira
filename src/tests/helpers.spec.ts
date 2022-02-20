import { expect } from 'chai';
import {
    timeFomattedDHMS,
    secondsFormattedHMS,
    roundDecimalPlaces,
    toTitle,
    groupObjectsByKey,
} from '@utils';

describe(__filename.slice(__dirname.length + 1).split('.')[0], () => {
    it('Приведение миллисекунд к виду D д H ч M м S с', () => {
        const second = 1000;
        const minute = 1000 * 60;
        const hour = 1000 * 60 * 60;
        const day = 1000 * 60 * 60 * 24;

        expect(timeFomattedDHMS(0)).equal('0 д 0 ч 0 м 0 с'); // 0000
        expect(timeFomattedDHMS(second)).equal('0 д 0 ч 0 м 1 с'); // 0001
        expect(timeFomattedDHMS(minute)).equal('0 д 0 ч 1 м 0 с'); // 0010
        expect(timeFomattedDHMS(second + minute)).equal('0 д 0 ч 1 м 1 с'); // 0011

        expect(timeFomattedDHMS(hour)).equal('0 д 1 ч 0 м 0 с'); // 0100
        expect(timeFomattedDHMS(hour + second)).equal('0 д 1 ч 0 м 1 с'); // 0101
        expect(timeFomattedDHMS(hour + minute)).equal('0 д 1 ч 1 м 0 с'); // 0110
        expect(timeFomattedDHMS(hour + minute + second)).equal(
            '0 д 1 ч 1 м 1 с',
        ); // 0111

        expect(timeFomattedDHMS(day)).equal('1 д 0 ч 0 м 0 с'); // 1000
        expect(timeFomattedDHMS(day + second)).equal('1 д 0 ч 0 м 1 с'); // 1001
        expect(timeFomattedDHMS(day + minute)).equal('1 д 0 ч 1 м 0 с'); // 1010
        expect(timeFomattedDHMS(day + minute + second)).equal(
            '1 д 0 ч 1 м 1 с',
        ); // 1011

        expect(timeFomattedDHMS(day + hour)).equal('1 д 1 ч 0 м 0 с'); // 1100
        expect(timeFomattedDHMS(day + hour + second)).equal('1 д 1 ч 0 м 1 с'); // 1101
        expect(timeFomattedDHMS(day + hour + minute)).equal('1 д 1 ч 1 м 0 с'); // 1110
        expect(timeFomattedDHMS(day + hour + minute + second)).equal(
            '1 д 1 ч 1 м 1 с',
        ); // 1111

        expect(() => timeFomattedDHMS(-1)).to.throw(); // Отрицательные значения запрещены

        expect(timeFomattedDHMS(499)).equal('0 д 0 ч 0 м 0 с');
        expect(timeFomattedDHMS(999.1)).equal('0 д 0 ч 0 м 1 с');
        expect(timeFomattedDHMS(999.6)).equal('0 д 0 ч 0 м 1 с');
    });

    it('Приведение секунд к виду: H ч M мин | M мин S сек | что-то одно', () => {
        const minute = 60;
        const hour = 60 * 60;

        expect(secondsFormattedHMS(0)).equal('0 сек');

        expect(secondsFormattedHMS(minute)).equal('1 мин');
        expect(secondsFormattedHMS(hour + minute)).equal('1 ч 1 мин');
        expect(secondsFormattedHMS(minute + 1)).equal('1 мин 1 сек');
        expect(secondsFormattedHMS(hour + minute)).equal('1 ч 1 мин');
        expect(secondsFormattedHMS(hour)).equal('1 ч');

        expect(() => secondsFormattedHMS(-1)).to.throw();
    });

    it('Обрезать до N десятичных знаков', () => {
        expect(roundDecimalPlaces(1.111, 2)).equal('1.11');
        expect(roundDecimalPlaces(1, 2)).equal('1.00');
        expect(roundDecimalPlaces(-1.11, 1)).equal('-1.1');
    });

    it('Все первые буквы станут заглавными, а остальные маленькими', () => {
        expect(toTitle('tiTle')).equal('Title');
        expect(toTitle('tHe tiTle')).equal('The Title');
        expect(toTitle('нА Русском')).equal('На Русском');
    });

    it('Группировка массива объектов по ключу', () => {
        const arrayObjects = [
            { status: 200, description: 'OK' },
            { status: 200, description: 'OK' },
            { status: 404, description: 'Not Found' },
            { status: 500, description: 'Internal Server Error' },
        ];
        const byKey = 'status';
        const result = [
            {
                key: 200,
                values: [
                    { status: 200, description: 'OK' },
                    { status: 200, description: 'OK' },
                ],
            },
            { key: 404, values: [{ status: 404, description: 'Not Found' }] },
            {
                key: 500,
                values: [{ status: 500, description: 'Internal Server Error' }],
            },
        ];
        expect(groupObjectsByKey(arrayObjects, byKey)).to.deep.equal(result);
    });
});
