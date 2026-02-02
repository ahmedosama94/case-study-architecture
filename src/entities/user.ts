import { Entity, Column, Index, BeforeInsert, BeforeUpdate } from 'typeorm';

import { TimestampsMixin } from './timestamps-mixin';
import { BaseEntity } from './base-entity';

export type Password = `${string}:${string}`;

@Entity({ name: 'users' })
export class User extends TimestampsMixin(BaseEntity) {
    @Column()
    @Index({ unique: true })
        email: string;

    @Column({ name: 'first_name' })
        firstName: string;

    @Column({ name: 'last_name' })
        lastName: string;

    @Column()
        password: string;

    //#region hooks
    @BeforeInsert()
    @BeforeUpdate()
    emailToLowerCase(): void {
        this.email = this.email.toLowerCase();
    }
    //#endregion
}
