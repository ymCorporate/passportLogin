import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import bcrypt from 'bcrypt';
import flash from 'express-flash';
import session from 'express-session';
import initPassport from './passport-config.mjs';
import passport from 'passport';
import methodOverride from 'method-override';
import yup from 'yup';

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

app.get('/', checkAuth, renderIndex);
app.get('/login', checkNotAuth, renderLogin);
app.post('/login', checkNotAuth, authenticateUser);
app.get('/register', checkNotAuth, renderRegister);
app.post('/register', checkNotAuth, postReg);
app.post('/logout', deleteUser);

const registrationSchema = yup.object().shape({
    name: yup.string().required().min(3).trim(),
    email: yup.string().email().required(),
    password: yup.string().required().min(6),
});

const loginSchema = yup.object().shape({
    email: yup.string().email().required(),
    password: yup.string().required(),
});

function renderIndex(req, res) {
    res.render('index.ejs', { name: req.user.name });
}

function renderLogin(req, res) {
    res.render('login.ejs');
}

function renderRegister(req, res) {
    res.render('register.ejs');
}

function checkAuth(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    } else {
        res.redirect('/login');
    }
}

function checkNotAuth(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect('/');
    }
    next();
}

function deleteUser(req, res) {
    req.logOut();
    res.redirect('/login');
}

async function authenticateUser(req, res) {
    try {
        await loginSchema.validate(req.body, { abortEarly: false });
        passport.authenticate('local', {
            successRedirect: '/',
            failureRedirect: '/login',
            failureFlash: true,
        })(req, res);
    } catch (err) {
        console.error(err);
        req.flash('error', 'Enter valid credentials');
        res.redirect('/login');
    }
}

async function postReg(req, res) {
    try {
        await registrationSchema.validate(req.body, { abortEarly: false });
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
app.listen(3000)
