const DiffMatchPatch = require("diff-match-patch");
const pgp = require("pg-promise")();

const dmp = new DiffMatchPatch();

const db = pgp(process.env.BUSYDB_URI || "postgres://localhost:5432/busydb");

async function addUser(timestamp, username) {
  await db.none(
    "INSERT INTO accounts(created_at, name) VALUES ($1, $2) ON CONFLICT DO NOTHING",
    [timestamp, username]
  );
}

async function addPost(
  timestamp,
  parentAuthor,
  parentPermlink,
  author,
  permlink,
  title,
  body
) {
  const oldPost = await db.oneOrNone(
    "SELECT title, body FROM posts WHERE author=$1 AND permlink=$2",
    [author, permlink]
  );

  if (!oldPost) {
    await db.none(
      "INSERT INTO posts(created_at, updated_at, parent_author, parent_permlink, author, permlink, title, body) VALUES ($1, $1, $2, $3, $4, $5, $6, $7)",
      [timestamp, parentAuthor, parentPermlink, author, permlink, title, body]
    );

    return;
  }

  if (oldPost) {
    let isPatch = false;
    let patch = null;

    try {
      patch = dmp.patch_fromText(body);
      isPatch = patch.length !== 0;
    } catch (err) {
      isPatch = false;
    }

    const newBody = isPatch ? dmp.patch_apply(patch, oldPost.body)[0] : body;

    if (oldPost.title === title && oldPost.body === newBody) return;

    await db.none(
      "UPDATE posts SET updated_at=$1, title=$2, body=$3 WHERE author=$4 AND permlink=$5",
      [timestamp, title, newBody, author, permlink]
    );
  }
}

async function deletePost(timestamp, author, permlink) {
  await db.none("DELETE FROM posts WHERE author=$1 and permlink=$2", [
    author,
    permlink
  ]);
}

async function addVote(timestamp, voter, author, permlink, weight) {
  await db.none(
    "INSERT INTO votes(created_at, updated_at, post_author, post_permlink, voter, weight) VALUES ($1, $1, $2, $3, $4, $5) ON CONFLICT ON CONSTRAINT uc_vote DO UPDATE SET weight=$5",
    [timestamp, author, permlink, voter, weight]
  );
}

async function addFollow(timestamp, follower, followed) {
  await db.none(
    "INSERT INTO follows (created_at, updated_at, follower, followed) VALUES ($1, $1, $2, $3) ON CONFLICT DO NOTHING",
    [timestamp, follower, followed]
  );
}

async function removeFollow(timestamp, follower, followed) {
  await db.none("DELETE FROM follows WHERE follower=$1 and followed=$2", [
    follower,
    followed
  ]);
}

module.exports = {
  addUser,
  addPost,
  deletePost,
  addVote,
  addFollow,
  removeFollow
};
