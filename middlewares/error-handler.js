const createError = require("http-errors");

const errorHandlerMiddleware = async (err, req, res, next) => {
    console.log(err.name);
    if (req.path === "/auth/login" && err.isJoi === true) {
        err.status = 400;
        err.message = "invalid email or password";
    }

    if (err.isJoi === true) err.status = 422;
    return res.status(err.status || 500).json({
        error: {
            status: err.status || 500,
            message: err.message,
        },
    });
};

module.exports = errorHandlerMiddleware;
