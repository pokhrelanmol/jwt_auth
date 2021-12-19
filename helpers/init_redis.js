const redis = require("redis");

const client = redis.createClient({
    port: 6379,
    host: "127.0.0.1",
});
(async () => {
    client.on("connect", () => {
        console.log("redis connected");
    });
    client.on("ready", () => {
        console.log("redis ready to use");
    });

    client.on("end", () => {
        console.log("Client disconnected from redis");
    });

    process.on("SIGINT", () => {
        client.quit();
    });
    client.on("error", (err) => console.log("Redis Client Error", err));
    await client.connect();
})();

module.exports = client;
