import 'reflect-metadata';

import { DataSource, Entity, PrimaryGeneratedColumn, Repository } from 'typeorm';
import { CreatedAtMixin } from './created-at-mixin';

@Entity()
class TestEntity extends CreatedAtMixin(class {}) {
    @PrimaryGeneratedColumn()
        id: number;
}

describe('CreatedAtMixin Tests', () => {
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

    it('sets created_at automatically on insert', async () => {
        const test = new TestEntity();
        await testRepository.save(test);

        expect(test.createdAt).toBeDefined();
        expect(test.createdAt.getTime()).toBeLessThanOrEqual(Date.now());

        expect(true).toBe(true);
    });
});
