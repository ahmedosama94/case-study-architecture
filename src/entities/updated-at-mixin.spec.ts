import 'reflect-metadata';

import { Column, DataSource, Entity, PrimaryGeneratedColumn, Repository } from 'typeorm';
import { promisify } from 'node:util';
import { UpdatedAtMixin } from './updated-at-mixin';

const delay = promisify(setTimeout);

@Entity()
class TestEntity extends UpdatedAtMixin(class {}) {
    @PrimaryGeneratedColumn()
        id: number;

    @Column({ nullable: true })
        someField: number;
}

describe('UpdatedAtMixin Tests', () => {
    let testRepository: Repository<TestEntity>;

    beforeAll(async () => {
        const dataSource = new DataSource({
            type: 'better-sqlite3',
            database: ':memory:',
            entities: [TestEntity],
            synchronize: true,
        });

        await dataSource.initialize()

        testRepository = dataSource.getRepository(TestEntity);
    });

    it('sets updated_at automatically on insert', async () => {
        const test = new TestEntity();
        await testRepository.save(test);

        expect(test.updatedAt).toBeDefined();
        expect(test.updatedAt.getTime()).toBeLessThanOrEqual(Date.now());

        expect(true).toBe(true);
    });

    it('resets updated_at automatically on update', async () => {
        const test = new TestEntity();
        await testRepository.save(test);

        const initialUpdatedAt = test.updatedAt;

        test.someField = 3;
        await delay(100);
        await testRepository.save(test);

        expect(test.updatedAt).toBeDefined();
        expect(test.updatedAt.getTime()).toBeLessThanOrEqual(Date.now());
        expect(test.updatedAt.getTime()).toBeGreaterThanOrEqual(initialUpdatedAt.getTime());

        expect(true).toBe(true);
    });
});
