const pgp = require("pg-promise")();

const db = pgp("postgres://localhost:5432/busydb");

async function addUser(timestamp, username) {
  await db.none(
    "INSERT INTO accounts(created_at, name) VALUES ($1, $2) ON CONFLICT DO NOTHING",
    [timestamp, username]
  );
}

module.exports = {
  addUser
};
