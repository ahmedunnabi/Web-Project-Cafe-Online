const Joi = require('joi');

const registerSchema = Joi.object({
    username: Joi.string().min(3).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(3).max(50).required()
})

const loginSchema = Joi.object({
    username: Joi.string().min(3).max(50).required(),
    password: Joi.string().min(3).max(50).required()
})

const foodItemSchema = Joi.object({
    name: Joi.string().min(1).max(200).required(),
    description: Joi.string().min(1).max(500).required(),
    price: Joi.number().integer().min(0).required()
})

const passwordChangeSchema = Joi.object({
    username: Joi.string().min(3).max(50).required(),
    currentPassword: Joi.string().min(3).max(50).required(),
    newPassword: Joi.string().min(3).max(50).required()
})

const orderSchema = Joi.object({
    username: Joi.string().min(3).max(50).required(),
    foodList: Joi.array().required(),
    address: Joi.string().min(3).max(500).required()
})


module.exports = {
    registerSchema,
    loginSchema,
    foodItemSchema,
    passwordChangeSchema,
    orderSchema
}