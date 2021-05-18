import 'source-map-support/register';
import express from 'express';
import { Server } from 'typescript-rest';
import cors from 'cors'
import 'reflect-metadata'
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import { initContainer } from './container';
import {UserCtrl} from "./controllers/user-ctrl";
import {interfaces} from "inversify";
import Newable = interfaces.Newable;
import { getLogger, Logger } from 'log4js';
import {authMiddleware} from "./controllers/auth-middleware";
const swaggerDocument = YAML.load('swagger/api.yml');
initContainer().then(container => {
    const logger: Logger = getLogger('app');
    logger.level = 'info';
    const app = express();
    app.use(cors());
    app.use('/swagger-docs', swaggerUi.serve,  swaggerUi.setup(swaggerDocument));
    app.use('/', authMiddleware(container).unless({ path : [ '/user/key', '/users' ] }))
    Server.registerServiceFactory({
        create: serviceClass => {
            return container.get(serviceClass);
        },
        getTargetClass: serviceClass => {
            return serviceClass as FunctionConstructor;
        }
    });
    Server.buildServices(app);
    app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
        if(err.statusCode) {
            return res.status(err.statusCode).send({
                message : err.message
            });
        }
        logger.error(err);
        res.status(500).send({
            message : "something bad happened"
        });

    })
    app.listen(1238);
    console.log("Server listing to 1238")
})


