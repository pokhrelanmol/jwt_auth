const jwt = require("jsonwebtoken");
const createError = require("http-errors");

const client = require("./init_redis");
require("dotenv").config();

module.exports = {
    signAccessToken: (userId) => {
        return new Promise((resolve, reject) => {
            const payload = {};
            const secret = process.env.ACCESS_TOKEN_SECRET;
            const options = {
                expiresIn: "1d",
                audience: userId,
            };
            jwt.sign(payload, secret, options, (err, token) => {
                if (err) {
                    console.log(err.message);
                    reject(
                        createError.InternalServerError(
                            "opps!! we are sorry its our fault, Please Try again later"
                        )
                    );
                }
                resolve(token);
            });
        });
    },
    verifyAccessToken: (req, res, next) => {
        if (!req.headers["authorization"])
            return next(createError.Unauthorized());
        const authHeader = req.headers["authorization"];
        const token = authHeader.split(" ")[1];
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, payload) => {
            if (err) {
                const message =
                    err.name === "JsonWebTokenError"
                        ? "Unauthorized"
                        : err.message;
                return next(createError.Unauthorized(message));
            }
            req.payload = payload;
            next();
        });
    },
    signRefreshToken: (userId) => {
        console.log(userId);
        return new Promise((resolve, reject) => {
            const payload = {};
            const secret = process.env.REFRESH_TOKEN_SECRET;
            const options = {
                expiresIn: "1y",
                audience: userId,
            };
            jwt.sign(payload, secret, options, (err, token) => {
                if (err) {
                    console.log(err.message);
                    reject(
                        createError.InternalServerError(
                            "opps!! we are sorry its our fault, Please Try again later"
                        )
                    );
                }
                // save token in redis
                client
                    .SET(userId, token, "EX", 365 * 24 * 60 * 60)
                    .then((reply) => resolve(token))
                    .catch((err) => {
                        console.log(err.message);
                        reject(createError.InternalServerError());
                        return;
                    });
            });
        });
    },
    verifyRefreshToken: (refreshToken) => {
        return new Promise((resolve, reject) => {
            jwt.verify(
                refreshToken,
                process.env.REFRESH_TOKEN_SECRET,
                (err, payload) => {
                    if (err) return reject(createError.Unauthorized());
                    const userId = payload.aud;
                    client
                        .GET(userId)
                        .then((result) => {
                            if (refreshToken === result) resolve(userId);
                            reject(createError.InternalServerError());
                        })
                        .catch((err) => {
                            console.log(err.message);
                            reject(createError.Unauthorized());
                        });
                }
            );
        });
    },
};
