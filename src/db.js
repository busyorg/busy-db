const pgp = require("pg-promise")();

const db = pgp("postgres://localhost:5432/busydb");

async function addUser(username) {
  await db.none(
    "INSERT INTO accounts(name) VALUES ($1) ON CONFLICT DO NOTHING",
    [username]
  );
}

module.exports = {
  addUser
};
