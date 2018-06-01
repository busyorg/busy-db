const DiffMatchPatch = require("diff-match-patch");
const pgp = require("pg-promise")();

const dmp = new DiffMatchPatch();

const db = pgp("postgres://localhost:5432/busydb");

async function addUser(timestamp, username) {
  await db.none(
    "INSERT INTO accounts(created_at, name) VALUES ($1, $2) ON CONFLICT DO NOTHING",
    [timestamp, username]
  );
}

async function addPost(timestamp, author, permlink, title, body) {
  const oldPost = await db.oneOrNone(
    "SELECT id, title, body FROM posts WHERE author=$1 AND permlink=$2",
    [author, permlink]
  );

  if (!oldPost) {
    await db.none(
      "INSERT INTO posts(created_at, updated_at, author, permlink, title, body) VALUES ($1, $1, $2, $3, $4, $5)",
      [timestamp, author, permlink, title, body]
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
      "UPDATE posts SET updated_at=$1, title=$2, body=$3 WHERE id=$4",
      [timestamp, title, newBody, oldPost.id]
    );
  }
}

async function votePost(timestamp, voter, author, permlink, weight) {
  const post = await db.oneOrNone(
    "SELECT id FROM posts WHERE author=$1 AND permlink=$2",
    [author, permlink]
  );

  if (!post) return;

  const oldVote = await db.oneOrNone(
    "SELECT id, weight FROM votes WHERE post_id=$1",
    [post.id]
  );

  if (!oldVote) {
    await db.none(
      "INSERT INTO votes(created_at, updated_at, post_id, voter, weight) VALUES ($1, $1, $2, $3, $4)",
      [timestamp, post.id, voter, weight]
    );

    return;
  }

  if (oldVote.weight === weight) return;

  await db.none("UPDATE votes SET updated_at=$1, weight=$2 WHERE id=$3", [
    timestamp,
    weight,
    oldVote.id
  ]);
}

module.exports = {
  addUser,
  addPost,
  votePost
};
