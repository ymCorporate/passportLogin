if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

const express = require('express');
const app = express()
const bcrypt = require('bcrypt')
const Joi = require('joi');
const flash = require('express-flash')
const session = require('express-session')
const passport = require('passport')
const req = require("express/lib/request");
const methodOverride = require('method-override');
const initPassport = require('./passport-config')

initPassport(passport,
    email => users.find(user=>user.email === email),
    id => users.find(user=>user.id === id)
)

const users=[]

app.use(methodOverride('_method'));
app.use(flash())
app.use(passport.initialize())
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave:false,
    saveUninitialized: false,
}))
app.use(passport.session())
app.use(express.urlencoded({extended:false}))
app.use(express.json())
app.set('view engine', 'ejs');

app.get('/', checkAuth,renderIndex)
app.get('/login',checkNotAuth, renderLogin)
app.post('/login',checkNotAuth,authenticateUser)
app.get('/register',checkNotAuth, renderRegister)
app.post('/register',checkNotAuth,postReg)
app.post('/logout',deleteUser)

const registrationSchema = Joi.object({
    name: Joi.string().required().min(3).trim(), // Trim leading/trailing whitespaces
    email: Joi.string().email().required(),
    password: Joi.string().required().min(6),
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
});

function renderIndex (req, res) {
    res.render('index.ejs',{ name: req.user.name})
}

function renderLogin (req, res) {
    res.render('login.ejs')
}

function renderRegister (req, res) {
    res.render('register.ejs')
}

function checkAuth (req, res ,next) {
    if(req.isAuthenticated()){
        return next();
    }
    else{
        res.redirect('/login')
    }
}

function checkNotAuth(req,res,next){
    if(req.isAuthenticated()){
        return res.redirect('/')
    }
    next()
}

function deleteUser(req,res){
    req.logOut(req,res)
    req.redirect('/login')
}

// function logout(req, res) {
//     // Handle logout logic (e.g., destroy session, update database)
//     req.session.destroy(); // Example using session store
//     res.redirect('/login');
// }

async function authenticateUser(req, res)  {
    try {
        const { error } = loginSchema.validate(req.body);
        if (error) {
            //alert('Enter valid credentials');
            req.flash('error', error.details[0].message);
            return res.redirect('/login');
        }

        passport.authenticate('local', {
            successRedirect: '/',
            failureRedirect: '/login',
            failureFlash: true,
        })(req, res);
    }
    catch (err) {
        console.error(err);
        //alert('Enter valid credentials');
        req.flash('error', 'An unexpected error occurred');
        res.redirect('/login');
    }
}

async function postReg (req, res) {
    try{
        const { error } = registrationSchema.validate(req.body);
        if (error) {
            req.flash('error', error.details[0].message);
            return res.redirect('/register');
        }

        const hashedPassword = await bcrypt.hash(req.body.password, 10)
        users.push({
            id:Date.now().toString(),
            name:req.body.name,
            email:req.body.email,
            password:hashedPassword
        })
        res.redirect('/login')
    }
    catch(err){
        console.error(err);
        req.flash('error', 'An unexpected error occurred');
        res.redirect('/register')
    }
    console.log(users)
}

app.listen(3000)

// async function postReg (req, res) {
//     try{
//         // const { error } = registrationSchema.validate(req.body);
//         // if (error) {
//         //     req.flash('error', error.details[0].message); // Use flash for errors
//         //     return res.redirect('/register');
//         // }
//         const hashedPassword = await bcrypt.hash(req.body.password, 10)
//         users.push({
//             id:Date.now().toString(),
//             name:req.body.name,
//             email:req.body.email,
//             password:hashedPassword
//         })
//         res.redirect('/login')
//     }
//     catch{
//         res.redirect('/register')
//     }
//     console.log(users)
// }

// async function authLogin(req, res) {
//     passport.authenticate('local',{
//         successRedirect: '/',
//         failureRedirect: '/login',
//         failureFlash:true
//     })
// }



// function authenticateUser(req, res, next) {
//     passport.authenticate('local', {
//         successRedirect: '/',
//         failureRedirect: '/login',
//         failureFlash: true
//     })(req, res, next);
// }

// async function postReg (req, res)  {
//     try {
//         const { error } = registrationSchema.validate(req.body);
//         if (error) {
//             req.flash('error', error.details[0].message);
//             return res.redirect('/register');
//         }
//
//         const hashedPassword = await bcrypt.hash(req.body.password, 10);
//         users.push({
//             id: Date.now().toString(),
//             name: req.body.name,
//             email: req.body.email,
//             password: hashedPassword,
//         });
//         res.redirect('/login');
//     } catch (err) {
//         console.error(err);
//         req.flash('error', 'An unexpected error occurred');
//         res.redirect('/register');
//     }
// }
