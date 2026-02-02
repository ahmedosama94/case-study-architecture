// import { SSMClient, GetParametersCommand } from '@aws-sdk/client-ssm';

import { DataSource } from 'typeorm';
import * as entities from './entities';

let dataSource: DataSource | null = null;

export const getDataSource = () => {
    if (!dataSource) {
        dataSource = new DataSource({
            type: 'better-sqlite3',
            database: 'temp.db',
            entities,
            synchronize: true,
            // logging: true,
        });
    }

    return dataSource;
};

// const getParametersFromSSM = async () => {
//     try {
//         const ssmClient = new SSMClient({ region: 'eu-central-1' });
//
//         const input = {
//             Names: [
//                 'k8s_rds_host',
//                 'k8s_rds_db_name',
//                 'k8s_rds_master_username',
//                 'k8s_rds_master_password',
//             ],
//             WithDecryption: true,
//         };
//
//         const command = new GetParametersCommand(input);
//
//         const response = await ssmClient.send(command);
//
//         const envVars: any = {};
//
//         if (response.Parameters) {
//             for (const p of response.Parameters) {
//                 envVars[p.Name!] = p.Value;
//             }
//         }
//
//         return envVars;
//     } catch (error: any) {
//         console.log('Failed to read parameters from SSM with error: ', error);
//     }
// };

// Configuration for Datasource
