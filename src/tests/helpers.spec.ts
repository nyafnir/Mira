import { expect } from 'chai';
import {
    convertMsToDHMS,
    roundDecimalPlaces,
    toTitle,
    groupObjectsByKey,
} from '@utils';

describe(__filename.slice(__dirname.length + 1).split('.')[0], () => {
    describe('Преобразователь времени', () => {
        const second = 1000;
        const minute = 1000 * 60;
        const hour = 1000 * 60 * 60;
        const day = 1000 * 60 * 60 * 24;

        it('Должно вернуть миллисекунды в формате: D д? H ч? M мин? S сек? | меньше секунды', () => {
            expect(convertMsToDHMS(0).toString()).equal('меньше секунды'); // 0000
            expect(convertMsToDHMS(second).toString()).equal('1 сек'); // 0001
            expect(convertMsToDHMS(minute).toString()).equal('1 мин'); // 0010
            expect(convertMsToDHMS(second + minute).toString()).equal(
                '1 мин 1 сек',
            ); // 0011

            expect(convertMsToDHMS(hour).toString()).equal('1 ч'); // 0100
            expect(convertMsToDHMS(hour + second).toString()).equal(
                '1 ч 1 сек',
            ); // 0101
            expect(convertMsToDHMS(hour + minute).toString()).equal(
                '1 ч 1 мин',
            ); // 0110
            expect(convertMsToDHMS(hour + minute + second).toString()).equal(
                '1 ч 1 мин 1 сек',
            ); // 0111

            expect(convertMsToDHMS(day).toString()).equal('1 д'); // 1000
            expect(convertMsToDHMS(day + second).toString()).equal('1 д 1 сек'); // 1001
            expect(convertMsToDHMS(day + minute).toString()).equal('1 д 1 мин'); // 1010
            expect(convertMsToDHMS(day + minute + second).toString()).equal(
                '1 д 1 мин 1 сек',
            ); // 1011

            expect(convertMsToDHMS(day + hour).toString()).equal('1 д 1 ч'); // 1100
            expect(convertMsToDHMS(day + hour + second).toString()).equal(
                '1 д 1 ч 1 сек',
            ); // 1101
            expect(convertMsToDHMS(day + hour + minute).toString()).equal(
                '1 д 1 ч 1 мин',
            ); // 1110
            expect(
                convertMsToDHMS(day + hour + minute + second).toString(),
            ).equal('1 д 1 ч 1 мин 1 сек'); // 1111

            expect(() => convertMsToDHMS(-1)).to.throw(); // Отрицательные значения запрещены

            expect(convertMsToDHMS(499).toString()).equal('меньше секунды');
            expect(convertMsToDHMS(999.1).toString()).equal('меньше секунды');
            expect(convertMsToDHMS(999.6).toString()).equal('меньше секунды');

            expect(convertMsToDHMS(1499).toString()).equal('1 сек');
            expect(convertMsToDHMS(1500).toString()).equal('2 сек');
        });
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
