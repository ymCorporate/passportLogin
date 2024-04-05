import { check } from "express-validator";

const registrationValidation = [
    check('name').isLength({ min: 3 }).trim().withMessage('Name must be at least 3 characters long.'),
    check('email').isEmail().withMessage('Invalid email format.'),
    check('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.')
];

const loginValidation = [
    check('email').isEmail().withMessage('Invalid email format.'),
    check('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.')
];

export { registrationValidation, loginValidation };
