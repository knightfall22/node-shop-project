const crypto = require('crypto');

const User = require("../models/User");
const bcrypt = require("bcryptjs")
const sendGridTransport = require("nodemailer-sendgrid-transport")
const nodemailer = require("nodemailer");
const { validationResult } = require('express-validator');

const transport = nodemailer.createTransport(sendGridTransport({
    auth: {
        api_key: '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'
    }
}))
exports.getLogin = function(req, res, next) { 
    let message = req.flash('error')
    if(message.length > 0) {
        message = message[0]
    } else { 
        message = null
    }

    res.render('auth/login',  {
        path: '/login',  
        pageTitle: 'Login',
        errorMessage: message,
        validationErrors: [],
        oldInputs: {email: "", password: ""}
    })

}

exports.getSignup = function(req, res, next) { 
    let message = req.flash('error')
    if(message.length > 0) {
        message = message[0]
    } else { 
        message = null
    }

    res.render('auth/signup',  {
        path: '/signup',  
        pageTitle: 'Signup',
        errorMessage: message,
        oldInputs: {email: ""},
        validationErrors: [],
    })

}

exports.getReset = function(req, res, next) { 
    let message = req.flash('error')
    if(message.length > 0) {
        message = message[0]
    } else { 
        message = null
    }

    res.render('auth/reset',  {
        path: '/reset',  
        pageTitle: 'Reset Password',
        errorMessage: message
    })

}

exports.getNewPassword = function(req, res, next) { 
    const token = req.params.token;
    User.findOne({resetToken: token, resetTokenExpiration: {$gt: Date.now()}})
        .then(user => {
            let message = req.flash('error')
            if(message.length > 0) {
                message = message[0]
            } else { 
                message = null
            }
        
            res.render('auth/new-password',  {
                path: '/new-password',   
                pageTitle: 'New Password',
                errorMessage: message,
                userId: user._id.toString(),
                passwordToken: token 
            })
        })
        .catch(err => {
            const error = new Error(err)
            error.httpStatusCode = 500
            console.log(err)
            return next(error)
        })
} 

exports.postLogin = function(req, res, next) { 
    const email = req.body.email
    const password = req.body.password

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(422).render('auth/login',  {
            path: '/login',  
            pageTitle: 'Login',
            errorMessage: errors.array()[0].msg,
            validationErrors: errors.array(),
            oldInputs: {email, password},
        })
    }

    User.findOne({email})
    .then((user) => {
        bcrypt.compare(password, user.password)
            .then((result) => {
                if (result) {                    
                    req.session.isLoggedIn = true
                    req.session.user = user
                    return req.session.save((err) => {
                        console.log(err)
                        res.redirect('/');
                    })
                }
                return res.status(422).render('auth/login',  {
                    path: '/login',  
                    pageTitle: 'Login',
                    errorMessage: 'Invalid password',
                    validationErrors: [],
                    oldInputs: {email, password},
                })
            })
            .catch((err) => {
                console.log(err);
             })

    })
    .catch(err => {
        const error = new Error(err)
        error.httpStatusCode = 500
        console.log(err)
        return next(error)
    })
}


exports.postSignup = function(req, res, next) { 
    const email = req.body.email;
    const password = req.body.password;

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(422).render('auth/signup',  {
            path: '/signup',  
            pageTitle: 'Signup',
            errorMessage: errors.array()[0].msg,
            oldInputs: {email},
            validationErrors: errors.array()
        })
    }
   

            bcrypt.hash(password, 12)
                .then(hashedPassword => {
                    const user = new User({email, password: hashedPassword, cart: {items: []}})
                    return user.save();
                })
                .then(result => {
                    res.redirect('/login')
                    return transport.sendMail({
                        to: email,
                        from: 'pelumi066@gmail.com',
                        subject: 'Your account has been created successfully',
                        html: '<h1>Your account has been created successfully</h1>'
                    })
                })
                .catch(err => {
                    const error = new Error(err)
                    error.httpStatusCode = 500
                    console.log(err)
                    return next(error)
                })
}


exports.postLogout = function(req, res, next) { 
    req.session.destroy ((err) => {
        console.log(err);
        res.redirect('/');
    })
}

exports.postReset = function(req, res, next) { 
    crypto.randomBytes(32, (err, buffer) => { 
        if (err) { 
            console.error(err);
            return res.redirect('/reset'); 
        }

        const token = buffer.toString('hex');
        User.findOne({email: req.body.email})
            .then((user) => { 
                if (!user) {
                    req.flash('error', 'Email does not exist')
                    return res.redirect('/reset');
                }
                user.resetToken = token; 
                user.resetTokenExpiration = Date.now() + 3600000
                return user.save();
            })
            .then(result => {
                res.redirect('/'); 
                transport.sendMail({
                    to: req.body.email,
                    from: 'pelumi066@gmail.com',
                    subject: 'Password Reset',
                    html: `
                        <p>You requested a password reset</p>
                        <p>Click this <a href="http://localhost:3000/reset/${token}"> link</a> to set a new password </p>
                    `
                })
            })
            .catch(err => {
                const error = new Error(err)
                error.httpStatusCode = 500
                console.log(err)
                return next(error)
            })
    })
}


exports.postNewPassword = function(req, res, next) { 
    const newPassword = req.body.password;
    const passwordToken = req.body.passwordToken;
    const userId = req.body.userId;
    let resetUser;

    User.findOne({
      resetToken: passwordToken,
      resetTokenExpiration: { $gt: Date.now() },
      _id: userId,
    }).then((user) => {
        resetUser = user
        return bcrypt.hash(newPassword, 12)
    })
    .then(hashedPassword => {
        resetUser.password = hashedPassword;
        resetUser.resetToken = undefined;
        resetTokenExpiration = undefined
        return resetUser.save()

    })
    .then(result => {
        res.redirect('/login')
    })
    .catch(err => {
        const error = new Error(err)
        error.httpStatusCode = 500
        console.log(err)
        return next(error)
    })
}
