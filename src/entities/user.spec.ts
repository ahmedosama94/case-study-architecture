import type { DeepPartial, Repository } from 'typeorm';

import { DataSource } from 'typeorm';
import { faker } from '@faker-js/faker';

import { User } from './user';

describe('User Entity Tests', () => {
    let userRepository: Repository<User>;

    const generateUser = (data: DeepPartial<User> = {}) => {
        const user = new User();
        const defaults = {
            email: faker.internet.email(),
            firstName: faker.person.firstName(),
            lastName: faker.person.lastName(),
            password: faker.string.hexadecimal(),
        };

        userRepository.merge(user, defaults, data);

        return user;
    }

    beforeAll(async () => {
        const dataSource = new DataSource({
            type: 'better-sqlite3',
            database: ':memory:',
            entities: [User],
            synchronize: true,
        });

        await dataSource.initialize();

        userRepository = dataSource.getRepository(User);
    });

    afterEach(async () => {
        await userRepository.delete({});
    });

    describe('User.emailToLowerCase()', () => {
        it('casts email to lowercase', () => {
            const user = new User();
            user.email = 'SomeGuy@gmail.com';

            user.emailToLowerCase();

            expect(user.email).toBe('someguy@gmail.com');
        })

        it('should be called automatically before insert', async () => {
            const user = generateUser({ email: 'SomeOtherGuy@gmail.cOm' })

            await userRepository.save(user);

            expect(user.email).toBe('someotherguy@gmail.com');
        });

        it('should be called automatically before update', async () => {
            const user = generateUser();

            await userRepository.save(user);

            user.email = 'SomeThirdGuy@gmail.com'

            await userRepository.save(user);

            expect(user.email).toBe('somethirdguy@gmail.com');
        });
    });
});
