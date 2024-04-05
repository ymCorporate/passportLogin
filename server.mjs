import dotenv from 'dotenv';
import express from 'express';
import bcrypt from 'bcrypt';
import flash from 'express-flash';
import session from 'express-session';
import passport from 'passport';
import methodOverride from 'method-override';
//import yup from 'yup';
import initPassport from './passport-config.mjs';
//import { check,validationResult} from "express-validator";
import { registrationValidation,loginValidation } from './validation/validation.mjs';
import { checkAuth,checkNotAuth }from './authMiddleware/authMiddleware.mjs';
import {validationResult} from "express-validator";
import UserService from "./userService/userService.mjs";

dotenv.config();

const app = express();
const users = [];

initPassport(
    passport,
    email => users.find(user => user.email === email),
    id => users.find(user => user.id === id)
);

app.use(methodOverride('_method'));
app.use(flash());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.set('view engine', 'ejs');

// const registrationSchema = yup.object().shape({
//     name: yup.string().required().min(3).trim(),
//     email: yup.string().email().required(),
//     password: yup.string().required().min(6),
// });
//
// const loginSchema = yup.object().shape({
//     email: yup.string().email().required(),
//     password: yup.string().required(),
// });

app.get('/', checkAuth, renderIndex);
app.get('/register', checkNotAuth, renderRegister);
app.post('/register', checkNotAuth,registrationValidation,postReg);
app.get('/login', checkNotAuth, renderLogin);
app.post('/login', checkNotAuth,loginValidation,authenticateUser);
app.post('/logout', deleteUser);

function renderIndex(req, res) {
    res.render('index.ejs', { name: req.user.name });
}


function renderLogin(req, res) {
    res.render('login.ejs');
}

function renderRegister(req, res) {
    res.render('register.ejs');
}

// function checkAuth(req, res, next) {
//     if (req.isAuthenticated()) {
//         return next();
//     } else {
//         res.redirect('/login');
//     }
// }
//
// function checkNotAuth(req, res, next) {
//     if (req.isAuthenticated()) {
//         return res.redirect('/');
//     }
//     next();
// }

function deleteUser(req, res) {
    req.logOut();
    res.redirect('/login');
}

async function authenticateUser(req, res) {
    // const errors = validationResult(req);
    // if (!errors.isEmpty()) {
    //     return res.status(400).json({ errors: errors.array() });
    // }

    passport.authenticate('local', {
            successRedirect: '/',
            failureRedirect: '/login',
            failureFlash: true,
        })(req, res);
}

async function postReg(req, res) {
    // const errors = validationResult(req)
    // if (!errors.isEmpty()) {
    //     return res.status(400).json({ errors: errors.array() });
    // }
    try {
        const existingUser = await UserService.getUserByEmail(req.body.email);
        if (existingUser) {
            return res.status(409).json({ message: 'Email already exists' });
        }
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        users.push({
            id: Date.now().toString(),
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword,
        });
        res.redirect('/login');
    } catch (err) {
        console.error(err);
        req.flash('error', 'An unexpected error occurred');
        res.redirect('/register');
    }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

