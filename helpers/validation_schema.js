const Joi = require("joi");
const authSchema = Joi.object({
    email: Joi.string().email().lowercase().required(),
    password: Joi.string()
        //   .pattern(new RegExp("^[a-zA-Z0-9]{3,30}$"))
        .min(6)
        .required(),
});
module.exports = { authSchema };
