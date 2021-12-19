const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
require("express-async-errors");

require("./helpers/init_redis");
const morgan = require("morgan");
const authRoute = require("./routes/auth.route");

const notFoundMiddleware = require("./middlewares/not-found");
const errorMiddleware = require("./middlewares/error-handler");
const { verifyAccessToken } = require("./helpers/jwt_helper");
const app = express();
app.use(express.json());
app.use(morgan("dev"));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`server running on ${PORT}`);
    mongoose.connect(process.env.MONGO_URI, () => {
        console.log("mongoDB Connected Successfully");
    });
});
app.get("/", verifyAccessToken, async (req, res) => {
    res.json({ message: "we are ruuninng" });
});

// routes
app.use("/auth", authRoute);

// handling error
app.use(notFoundMiddleware);
app.use(errorMiddleware);
