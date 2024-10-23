

import 'dotenv/config';
import * as joi from 'joi';

interface EnvVars
{
    PORT : number;
    DATABASE_URL : string;

}

const envsScheme = joi.object({
    PORT : joi.number().required(),
})
.unknown(true);


const {error, value} = envsScheme.validate(process.env);

if(error)
{
    throw new Error(`Config validation error: ${error.message}`);
}

const envVars : EnvVars = value;

export const envs =
{
    port : envVars.PORT,
}