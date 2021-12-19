const express = require("express");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const createError = require("http-errors");
const User = require("../models/User.model");
const { authSchema } = require("../helpers/validation_schema");
const client = require("../helpers/init_redis");
const {
    signAccessToken,
    signRefreshToken,
    verifyRefreshToken,
} = require("../helpers/jwt_helper");
const router = express.Router();

router.post("/register", async (req, res, next) => {
    const result = await authSchema.validateAsync(req.body);
    const user = await User.findOne({ email: result.email });
    if (user) throw createError.Conflict(` ${result.email} already exists`);
    const hashedPassword = await bcrypt.hash(result.password, 10);

    const newUser = await User.create({ ...result, password: hashedPassword });
    // generate tokens
    const accessToken = await signAccessToken(newUser.id);
    const refreshToken = await signRefreshToken(newUser.id);

    res.json({ accessToken, refreshToken });
});

router.post("/login", async (req, res, next) => {
    console.log("hitting route");
    const result = await authSchema.validateAsync(req.body);
    const user = await User.findOne({ email: result.email });
    if (user) {
        console.log("user found");
        const passwordCorrect = await bcrypt.compare(
            result.password,
            user.password
        );
        if (passwordCorrect) {
            console.log("pass is correct");
            //  generate token
            const accessToken = await signAccessToken(user.id);

            const refreshToken = await signRefreshToken(user.id);

            res.send({ accessToken, refreshToken });
        }
        throw createError.BadRequest("invalid email or password");
    } else {
        throw createError.NotFound("user not Registered");
    }
});
router.delete("/logout", async (req, res, next) => {
    const { refreshToken } = req.body;
    if (!refreshToken) throw createError.BadRequest();
    const userId = await verifyRefreshToken(refreshToken);
    client
        .DEL(userId)
        .then((result) => {
            console.log("logged out" + result);
            res.status(204).json({ message: "user Log out successfull" });
        })
        .catch((err) => {
            throw createError.InternalServerError("Unable to log you out");
        });
});
router.post("/refresh-token", async (req, res, next) => {
    const { refreshToken } = req.body;
    if (!refreshToken) throw createError.BadRequest();
    const userId = await verifyRefreshToken(refreshToken);
    const accessToken = await signAccessToken(userId);
    const refToken = await signRefreshToken(userId);
    res.json({ accessToken, refreshToken: refToken });
});
module.exports = router;
