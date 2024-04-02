const express = require('express');
const app = express()
const bcrypt = require('bcrypt')
const flash = require('express-flash')
const session = require('express-session')
const initPassport = require('./passport-config')
const passport = require('passport')
const req = require("express/lib/request");
initPassport(passport,
    user =>user.find(email=>user.email === email)
)


const users=[]
app.use(flash())
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave:false,
    saveUninitialized: false,
}))
app.use(passport.initialize)
app.use(passport.session())
app.use(express.urlencoded({extended:false}))
app.use(express.json())
app.set('view engine', 'ejs');

app.get('/', renderIndex)
app.get('/login', renderLogin)
app.post('/login',authLogin)
app.get('/register', renderRegister)
app.post('/register',reqR)


function renderIndex (req, res) {
    res.render('index.ejs',{ name: 'redbull'})
}

function renderLogin (req, res) {
    res.render('login.ejs')
}

function renderRegister (req, res) {
    res.render('register.ejs')
}

async function reqR (req, res) {
   try{
       const hashedPassword = await bcrypt.hash(req.body.password, 10)
       users.push({
           id:Date.now().toString(),
           name:req.body.name,
           email:req.body.email,
           password:hashedPassword
   })
   res.redirect('/login')
   }
   catch{
       res.redirect('/register')
   }
    console.log(users)
}

async function authLogin(req, res) {
    passport.authenticate('local',{
        successRedirect: '/',
        failureRedirect: '/login',
        failureFlash:
    })
}
app.listen(3000)

