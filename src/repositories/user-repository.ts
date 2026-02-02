import { DeepPartial } from 'typeorm';
import { User } from '../entities';
import { getDataSource } from '../typeormconfig';

const dataSource = getDataSource();

export type CreateUserDto = Pick<User, 'email' | 'password' | 'firstName' | 'lastName'>;
export type UpdateUserDto = Partial<CreateUserDto>;

const baseUserRepository = dataSource.getRepository(User);
export const UserRepositoryImpl = baseUserRepository.extend({
    emailExists(email: User['email']) {
        return this.exist({ where: { email } });
    },

    findByEmail(email: User['email']) {
        return this.findOneBy({ email });
    },

    findById(id: User['id']) {
        return this.findOneBy({ id });
    },

    create(userData: CreateUserDto) {
        return this.save(baseUserRepository.create(userData));
    },

    update(id: User['id'], userData: UpdateUserDto){
        return baseUserRepository.update(id, userData as DeepPartial<User>);
    }
})

export type UserRepository = typeof UserRepositoryImpl;
