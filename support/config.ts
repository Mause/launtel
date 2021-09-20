import Joi from "joi";

type EnvSchema = {
  LAUNTEL_EMAIL: string;
  LAUNTEL_PASSWORD: string;
  JWT_SECRET: string;
  LOGTAIL_SOURCE_TOKEN: string;
};
const EnvSchema = Joi.object<EnvSchema>({
  LAUNTEL_EMAIL: Joi.string().email(),
  LAUNTEL_PASSWORD: Joi.string(),
  JWT_SECRET: Joi.string(),
  LOGTAIL_SOURCE_TOKEN: Joi.string()
}).validate(process.env, { stripUnknown: true });
if (EnvSchema.error) {
  throw EnvSchema.error;
}
export default EnvSchema.value as EnvSchema;
