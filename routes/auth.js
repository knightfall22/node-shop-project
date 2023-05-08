const path = require("path");
const express = require("express");
const User = require("../models/User");
const { check, body } = require("express-validator");


const root = require("../util/path");

const router = express.Router();
const {
  getLogin,
  postLogin,
  postLogout,
  getSignup,
  postSignup,
  getReset,
  postReset,
  getNewPassword,
  postNewPassword,
} = require("../controllers/auth");

router.get("/login", getLogin);

router.post(
    "/login", 
    [
        check("email")
            .isEmail()
            .withMessage("Please enter a valid email address")
            .custom(async (value, {req}) => {
                const email = await User.findOne({email: value});
                if(!email) {
                    throw new Error('Email not found');
                }
            })
            .normalizeEmail(),
        body(
            "password",
            "Please enter a password with only numbers and text and at least 5 characters"
            )
            .isLength({ min: 5 })
            .isAlphanumeric()
            .trim(),
    ]
    ,postLogin);

router.post("/logout", postLogout);

router.get("/signup", getSignup);

router.post(
  "/signup",
  [
    check("email")
      .isEmail()
      .withMessage("Please enter a valid email")
      .custom( async (value, {req}) => {
        const email = await User.findOne({email: value})
        if (email) {
            throw new Error('Email already registered')
        }
        return true
      })
      .normalizeEmail()
      ,

    body(
      "password",
      "Please enter a password with only numbers and text and at least 5 characters"
    )
      .isLength({ min: 5 })
      .isAlphanumeric()
      .trim(),

    body("confirmPassword")
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Both password must match");
      }
      return true;
    })
    .trim(),
  ],
  postSignup
);

router.get("/reset", getReset);

router.post("/reset", postReset);

router.get("/reset/:token", getNewPassword);

router.post("/new-password", postNewPassword);

module.exports = router;
