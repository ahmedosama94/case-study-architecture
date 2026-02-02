import 'reflect-metadata';
import { json } from 'body-parser';
import request from 'supertest';
import { Container } from 'inversify';
import { InversifyExpressServer } from 'inversify-express-utils';

import { handlers } from '../errors';
import { TYPES } from '../lib';
import { User } from '../entities';
import { getDataSource } from '../typeormconfig';
import { UserRepositoryImpl } from '../repositories';
import { JwtAuthMiddleware } from '../middlewares';
import { JwtServiceImpl, PasswordManagerServiceImpl, UserServiceImpl } from '../services';
import { NextFunction, Request, Response } from 'express';
import './user-controller';

const API_ROOT = '/partner-app/api';

describe('UserController integration', () => {
    let app: ReturnType<InversifyExpressServer['build']>;

    beforeAll(async () => {
        process.env.JWT_SECRET = 'test-secret';
        process.env.JWT_EXPIRES_IN = '24h';

        const dataSource = getDataSource();
        if (!dataSource.isInitialized) {
            await dataSource.initialize();
        }

        const container = new Container();
        container.bind(TYPES.JwtService).to(JwtServiceImpl);
        container.bind(TYPES.PasswordManagerService).to(PasswordManagerServiceImpl);
        container.bind(TYPES.JwtAuthMiddleware).to(JwtAuthMiddleware);
        container.bind(TYPES.UserRepository).toConstantValue(UserRepositoryImpl);
        container.bind(TYPES.UserService).to(UserServiceImpl);
        container.bind(TYPES.DB).toConstantValue(dataSource);

        const server = new InversifyExpressServer(container, null, { rootPath: API_ROOT });
        server.setConfig((expressApp) => {
            expressApp.use(json());
        });
        server.setErrorConfig((expressApp) => {
            for (const handler of handlers) {
                expressApp.use(handler);
            }

            expressApp.use((err: Error, _req: Request, res: Response, next: NextFunction) => {
                if (!res.headersSent) {
                    res.status(500).json({ message: 'Internal server error', details: err.message });
                }

                next(err);
            });
        });

        app = server.build();
    });

    beforeEach(async () => {
        const dataSource = getDataSource();
        await dataSource.getRepository(User).delete({});
    });

    afterAll(async () => {
        const dataSource = getDataSource();
        if (dataSource.isInitialized) {
            await dataSource.destroy();
        }
    });

    it('registers a user', async () => {
        const response = await request(app)
            .post(`${API_ROOT}/users/register`)
            .send({
                email: 'john@example.com',
                password: 'ValidPass1',
                firstName: 'John',
                lastName: 'Doe',
            });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            email: 'john@example.com',
            firstName: 'John',
            lastName: 'Doe',
        });
    });

    it('fails registration when email already exists', async () => {
        const payload = {
            email: 'john@example.com',
            password: 'ValidPass1',
            firstName: 'John',
            lastName: 'Doe',
        };

        await request(app)
            .post(`${API_ROOT}/users/register`)
            .send(payload)
            .expect(200);

        const response = await request(app)
            .post(`${API_ROOT}/users/register`)
            .send(payload);

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Email already in use');
    });

    it('rejects registration with invalid email', async () => {
        const response = await request(app)
            .post(`${API_ROOT}/users/register`)
            .send({
                email: 'not-an-email',
                password: 'ValidPass1',
                firstName: 'John',
                lastName: 'Doe',
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Validation failed');
        expect(response.body.errors.email).toContain('Invalid email');
    });

    it('rejects registration with weak password', async () => {
        const response = await request(app)
            .post(`${API_ROOT}/users/register`)
            .send({
                email: 'john@example.com',
                password: 'weak',
                firstName: 'John',
                lastName: 'Doe',
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Validation failed');
        expect(response.body.errors.password).toEqual(expect.arrayContaining([
            expect.stringContaining('Password must be at least 8 characters'),
        ]));
    });

    it('rejects registration when firstName or lastName is missing', async () => {
        const response = await request(app)
            .post(`${API_ROOT}/users/register`)
            .send({
                email: 'john@example.com',
                password: 'ValidPass1',
                firstName: '',
                lastName: '',
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Validation failed');
        expect(response.body.errors.firstName).toEqual(expect.arrayContaining(['firstName should not be empty']));
        expect(response.body.errors.lastName).toEqual(expect.arrayContaining(['lastName should not be empty']));
    });

    it('logs in and returns token', async () => {
        await request(app)
            .post(`${API_ROOT}/users/register`)
            .send({
                email: 'john@example.com',
                password: 'ValidPass1',
                firstName: 'John',
                lastName: 'Doe',
            })
            .expect(200);

        const response = await request(app)
            .post(`${API_ROOT}/users/login`)
            .send({
                email: 'john@example.com',
                password: 'ValidPass1',
            });

        expect(response.status).toBe(200);
        expect(response.body.token).toEqual(expect.any(String));
    });

    it('rejects login with invalid email', async () => {
        const response = await request(app)
            .post(`${API_ROOT}/users/login`)
            .send({
                email: 'not-an-email',
                password: 'ValidPass1',
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Validation failed');
        expect(response.body.errors.email).toEqual(expect.arrayContaining(['email must be an email']));
    });

    it('rejects login with missing password', async () => {
        const response = await request(app)
            .post(`${API_ROOT}/users/login`)
            .send({
                email: 'john@example.com',
                password: '',
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Validation failed');
        expect(response.body.errors.password).toEqual(expect.arrayContaining(['password should not be empty']));
    });

    it('rejects profile access without auth token', async () => {
        const response = await request(app).get(`${API_ROOT}/users/profile`);

        expect(response.status).toBe(401);
        expect(response.body).toEqual({ message: 'Unauthorized' });
    });

    it('gets current user profile for authenticated user', async () => {
        await request(app)
            .post(`${API_ROOT}/users/register`)
            .send({
                email: 'john@example.com',
                password: 'ValidPass1',
                firstName: 'John',
                lastName: 'Doe',
            })
            .expect(200);

        const loginResponse = await request(app)
            .post(`${API_ROOT}/users/login`)
            .send({
                email: 'john@example.com',
                password: 'ValidPass1',
            })
            .expect(200);

        const response = await request(app)
            .get(`${API_ROOT}/users/profile`)
            .set('Authorization', `Bearer ${loginResponse.body.token}`);

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            email: 'john@example.com',
            firstName: 'John',
            lastName: 'Doe',
        });
    });

    it('updates current user profile', async () => {
        await request(app)
            .post(`${API_ROOT}/users/register`)
            .send({
                email: 'john@example.com',
                password: 'ValidPass1',
                firstName: 'John',
                lastName: 'Doe',
            })
            .expect(200);

        const loginResponse = await request(app)
            .post(`${API_ROOT}/users/login`)
            .send({
                email: 'john@example.com',
                password: 'ValidPass1',
            })
            .expect(200);

        const response = await request(app)
            .patch(`${API_ROOT}/users/profile`)
            .set('Authorization', `Bearer ${loginResponse.body.token}`)
            .send({ firstName: 'Jane', lastName: 'Roe' });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            email: 'john@example.com',
            firstName: 'Jane',
            lastName: 'Roe',
        });
    });

    it('rejects profile update with non-string firstName', async () => {
        await request(app)
            .post(`${API_ROOT}/users/register`)
            .send({
                email: 'john@example.com',
                password: 'ValidPass1',
                firstName: 'John',
                lastName: 'Doe',
            })
            .expect(200);

        const loginResponse = await request(app)
            .post(`${API_ROOT}/users/login`)
            .send({
                email: 'john@example.com',
                password: 'ValidPass1',
            })
            .expect(200);

        const response = await request(app)
            .patch(`${API_ROOT}/users/profile`)
            .set('Authorization', `Bearer ${loginResponse.body.token}`)
            .send({ firstName: 123 });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Validation failed');
        expect(response.body.errors.firstName).toEqual(expect.arrayContaining(['firstName must be a string']));
    });

    it('rejects profile update with non-string lastName', async () => {
        await request(app)
            .post(`${API_ROOT}/users/register`)
            .send({
                email: 'john@example.com',
                password: 'ValidPass1',
                firstName: 'John',
                lastName: 'Doe',
            })
            .expect(200);

        const loginResponse = await request(app)
            .post(`${API_ROOT}/users/login`)
            .send({
                email: 'john@example.com',
                password: 'ValidPass1',
            })
            .expect(200);

        const response = await request(app)
            .patch(`${API_ROOT}/users/profile`)
            .set('Authorization', `Bearer ${loginResponse.body.token}`)
            .send({ lastName: false });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Validation failed');
        expect(response.body.errors.lastName).toEqual(expect.arrayContaining(['lastName must be a string']));
    });
});
