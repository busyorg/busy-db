const Promise = require("bluebird");
const Client = require("lightrpc");

Promise.promisifyAll(Client.prototype);
const client = new Client("https://api.steemit.com");

module.exports = client;
