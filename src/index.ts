import 'source-map-support/register';
import express from 'express';
import { Server } from 'typescript-rest';
import 'reflect-metadata'
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
const swaggerDocument = YAML.load('swagger/api.yml');

const app = express();
app.use('/swagger-docs', swaggerUi.serve,   swaggerUi.setup(swaggerDocument));

app.listen(1238);

console.log("Server listing to 1238")
