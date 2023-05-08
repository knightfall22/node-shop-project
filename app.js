const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const { default: mongoose } = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const fs = require('fs');
const https = require('https');

const app = express();
const adminRoutes = require('./routes/admin')
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');
// const { get404page } = require('./controllers/404');
const User = require('./models/User');
const { get404page, get500page } = require('./controllers/error');
const multer = require('multer');
const MONGO_DB_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.bzknkqd.mongodb.net/${process.env.MONGO_DB_NAME}?retryWrites=true&w=majority`
const store = new MongoDBStore({
    uri: MONGO_DB_URI,
    collection: 'sessions'
})

const csrfProtection = csrf();
const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images')
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname)
    },
})

const fileFilter = (req, file, cb) => { 
    if(file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg'){
        cb(null, true)
    } else {
        cb(null, false)
    }
}

// const privateKey = fs.readFileSync(path.join(__dirname, 'server.key'))
// const certificate = fs.readFileSync(path.join(__dirname, 'server.cert'))
app.set('view engine', 'ejs')
// app.set('views', 'views')

app.use(bodyParser.urlencoded({extended: false}))
app.use(express.static(path.join(__dirname, 'public')))
app.use("/images",express.static(path.join(__dirname, 'images')))

app.use(multer({storage: fileStorage, fileFilter}).single('image'))
app.use(session({secret: 'my secret', resave: false, saveUninitialized: false, store}))
app.use(csrfProtection)
app.use(flash())

const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), {flags: 'a'})
app.use(helmet())
app.use(compression())
app.use(morgan('combined', { stream: accessLogStream }))


app.use((req, res, next) => {
    res.locals.isAuthenticated = req.session.isLoggedIn
    res.locals.csrfToken = req.csrfToken()

    next()
})

app.use((req, res, next) => {
    if (!req.session.user) {
        return next()
    }

    User.findById(req.session.user._id)
        .then((user) => {
            if (!user) {
                return next()
            }
            req.user = user
            next()
        })
        .catch(err =>{next(new Error(err))})

})


app.use(adminRoutes)
app.use(shopRoutes)
app.use(authRoutes)

app.get('/500', get500page)
app.use(get404page)

app.use((error, req, res, next) => {
    res.status(500).render('500', {pageTitle: 'An error as occured', path: '/500'})
    console.log(error)
})

mongoose.connect(MONGO_DB_URI)
    .then((result) => {
        console.log("Connected to Mongo");
        // https.createServer({key: privateKey, cert: certificate}, app).listen(process.env.PORT || 3000)
        app.listen(process.env.PORT || 3000)
    })
    .catch(err => console.error(err))