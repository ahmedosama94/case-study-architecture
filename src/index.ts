import { json } from 'body-parser';
import { Request, Response } from 'express';

import 'reflect-metadata';
import dotenv from 'dotenv';
import { InversifyExpressServer } from 'inversify-express-utils';
import cors from 'cors';

import { diContainer } from '../inversify.config';
import { TYPES } from './lib';
import './controllers';

import { getDataSource } from './typeormconfig';

import { JwtServiceImpl, PasswordManagerServiceImpl, UserServiceImpl } from './services';
import { UserRepositoryImpl } from './repositories';
import { JwtAuthMiddleware } from './middlewares';
import { handlers } from './errors';

dotenv.config();

(async () => {
    try {
        diContainer.bind(TYPES.JwtService).to(JwtServiceImpl);
        diContainer.bind(TYPES.PasswordManagerService).to(PasswordManagerServiceImpl);
        diContainer.bind(TYPES.JwtAuthMiddleware).to(JwtAuthMiddleware);
        diContainer.bind(TYPES.UserRepository).toConstantValue(UserRepositoryImpl)
        diContainer.bind(TYPES.UserService).to(UserServiceImpl);

        // DB setup
        const dataSource = getDataSource();
        if (!dataSource.isInitialized) {
            await dataSource.initialize();
        }
        diContainer.bind(TYPES.DB).toConstantValue(dataSource);

        // Create app server
        const app = new InversifyExpressServer(diContainer, null, {
            rootPath: '/partner-app/api',
        });

        app.setErrorConfig((expressApp) => {
            for (const handler of handlers) {
                expressApp.use(handler);
            }

            expressApp.use((err: Error, _req: Request, res: Response) => {
                if(!res.headersSent) {
                    res.status(500).json({ message: 'Internal server error' });

                    console.error('Undefined error!');
                    console.error(err);
                }
            });
        });

        app.setConfig(app => {
            app.use(json());
            app.use(cors());
        });

        const server = app.build();

        const PORT = process.env.PORT || 9000;

        server.listen(PORT, () => {
            console.log(`Server listening on port ${PORT}`);
        });
    } catch (err) {
        console.error(err);
    }
})();
