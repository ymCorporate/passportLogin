if(process.env.NODE_ENV != "production"){
    require('dotenv').config({path:'.env.test'});
}

const request = require('supertest');
const express = require('express');
const passport = require('passport');
const session = require('express-session');
const bcrypt = require('bcrypt');
const initPassport = require('./passport-config');

// Mock users data for testing
const users = [
    {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        password: bcrypt.hashSync('password123', 10)
    }
];

const app = express();

// Mocking middleware functions
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(session({
    secret: 'testSecret',
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// Mocking passport
initPassport(passport,
    email => users.find(user => user.email === email),
    id => users.find(user => user.id === id)
);

// Mocking routes
app.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) return next(err);
        if (!user) {
            return res.status(401).send(info.message);
        }
        req.logIn(user, (err) => {
            if (err) return next(err);
            return res.status(200).send('Login successful');
        });
    })(req, res, next);
});

app.get('/logout', (req, res) => {
    req.logout();
    res.send('Logged out successfully');
});

// Sample protected route
app.get('/profile', (req, res) => {
    if (req.isAuthenticated()) {
        res.status(200).send(`Welcome ${req.user.name}`);
    } else {
        res.status(401).send('Unauthorized');
    }
});

// Testing
describe('Authentication', () => {
    it('should login a user with correct credentials', async () => {
        const res = await request(app)
            .post('/login')
            .send({ email: 'test@example.com', password: 'password123' });
        expect(res.statusCode).toEqual(200);
        expect(res.text).toEqual('Login successful');
    });

    it('should not login a user with incorrect credentials', async () => {
        const res = await request(app)
            .post('/login')
            .send({ email: 'test@example.com', password: 'wrongpassword' });
        expect(res.statusCode).toEqual(401);
    });

    it('should logout a logged-in user', async () => {
        const res = await request(app).get('/logout');
        expect(res.statusCode).toEqual(200);
        expect(res.text).toEqual('Logged out successfully');
    });

    it('should not access protected route without logging in', async () => {
        const res = await request(app).get('/profile');
        expect(res.statusCode).toEqual(401);
    });

    it('should access protected route after logging in', async () => {
        await request(app)
            .post('/login')
            .send({ email: 'test@example.com', password: 'password123' });
        const res = await request(app).get('/profile');
        expect(res.statusCode).toEqual(200);
        expect(res.text).toEqual('Welcome Test User');
    });
});
