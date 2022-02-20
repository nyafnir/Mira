import { expect } from 'chai';
import { cooldowns } from '@services/cooldowner';
import { chance } from '@utils';

describe(__filename.slice(__dirname.length + 1).split('.')[0], () => {
    const data = {
        guildId: chance.integer().toString(),
        userId: chance.integer().toString(),
        commandName: chance.word(),
        cooldownSeconds: chance.integer({ min: 60, max: 360 }),
    };

    it('Должны установить откат', () => {
        expect(
            cooldowns.set(
                data.userId,
                data.guildId,
                data.commandName,
                data.cooldownSeconds,
            ),
        ).to.be.undefined;
    });

    it('Должны вернуть правильное время отката', () => {
        expect(
            cooldowns.set(
                data.userId,
                data.guildId,
                data.commandName,
                data.cooldownSeconds,
            ),
        ).to.be.undefined;
        expect(
            cooldowns.get(data.userId, data.guildId, data.commandName),
        ).lessThanOrEqual(data.cooldownSeconds);
    });
});
