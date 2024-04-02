if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

const express = require('express');
const app = express()
const bcrypt = require('bcrypt')
const flash = require('express-flash')
const session = require('express-session')
const initPassport = require('./passport-config')
const passport = require('passport')
const req = require("express/lib/request");
const methodOverride = require('method-override');
initPassport(passport,
    email => users.find(user=>user.email === email),
    id => users.find(user=>user.id === id)
)

const users=[]

app.use(methodOverride('_method'));
app.use(flash())
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave:false,
    saveUninitialized: false,
}))

app.use(passport.initialize())
app.use(passport.session())
app.use(express.urlencoded({extended:false}))
app.use(express.json())
app.set('view engine', 'ejs');


app.get('/', checkAuth,renderIndex)
app.get('/login',checkNotAuth, renderLogin)
app.post('/login',checkNotAuth,passport.authenticate('local',{
    successRedirect:'/',
    failureRedirect:'/login',
    failureFlash:true
}))
app.get('/register',checkNotAuth, renderRegister)
app.post('/register',checkNotAuth,postReg)
app.delete('/logout',deleteUser)


function renderIndex (req, res) {
    res.render('index.ejs',{ name: req.user.name})
}

function renderLogin (req, res) {
    res.render('login.ejs')
}

function renderRegister (req, res) {
    res.render('register.ejs')
}

async function postReg (req, res) {
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

// async function authLogin(req, res) {
//     passport.authenticate('local',{
//         successRedirect: '/',
//         failureRedirect: '/login',
//         failureFlash:true
//     })
// }

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
    req.logOut()
    res.redirect('/login')
}
app.listen(3000)

