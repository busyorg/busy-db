const pgp = require("pg-promise")();
const { getNewBody } = require("./utils");

const db = pgp(process.env.DATABASE_URL || "postgres://localhost:5432/busydb");

function tx(arrQueries) {
  return db.tx(t =>
    t.batch(arrQueries.map(query => t.none(query[0], query[1])))
  );
}

function addUser(timestamp, username) {
  return [
    "INSERT INTO accounts (created_at, name) VALUES ($1, $2) ON CONFLICT DO NOTHING",
    [timestamp, username]
  ];
}

async function addPost(timestamp, category, author, permlink, title, body) {
  const oldPost = await db.oneOrNone(
    "SELECT title, body FROM posts WHERE author=$1 AND permlink=$2",
    [author, permlink]
  );

  if (!oldPost) {
    return [
      "INSERT INTO posts (created_at, updated_at, category, author, permlink, title, body) VALUES ($1, $1, $2, $3, $4, $5, $6)",
      [timestamp, category, author, permlink, title, body]
    ];
  }

  if (oldPost) {
    const newBody = getNewBody(oldPost.body, body);
    if (oldPost.title === title && oldPost.body === newBody) return;
    return [
      "UPDATE posts SET updated_at=$1, title=$2, body=$3 WHERE author=$4 AND permlink=$5",
      [timestamp, title, newBody, author, permlink]
    ];
  }
}

async function addComment(
  timestamp,
  parentAuthor,
  parentPermlink,
  author,
  permlink,
  body
) {
  const oldComment = await db.oneOrNone(
    "SELECT body FROM comments WHERE author=$1 AND permlink=$2",
    [author, permlink]
  );

  if (!oldComment) {
    return [
      "INSERT INTO comments (created_at, updated_at, parent_author, parent_permlink, author, permlink, body) VALUES ($1, $1, $2, $3, $4, $5, $6)",
      [timestamp, parentAuthor, parentPermlink, author, permlink, body]
    ];
  }

  if (oldComment) {
    const newBody = getNewBody(oldComment.body, body);
    if (oldComment.body === newBody) return;
    return [
      "UPDATE comments SET updated_at=$1, body=$2 WHERE author=$3 AND permlink=$4",
      [timestamp, newBody, author, permlink]
    ];
  }
}

function deletePost(timestamp, author, permlink) {
  return [
    "DELETE FROM posts WHERE author=$1 and permlink=$2",
    [author, permlink]
  ];
}

function addVote(timestamp, voter, author, permlink, weight) {
  return [
    "INSERT INTO votes(created_at, updated_at, post_author, post_permlink, voter, weight) VALUES ($1, $1, $2, $3, $4, $5) ON CONFLICT ON CONSTRAINT uc_vote DO UPDATE SET weight=$5",
    [timestamp, author, permlink, voter, weight]
  ];
}

function addFollow(timestamp, follower, followed) {
  return [
    "INSERT INTO follows (created_at, updated_at, follower, followed) VALUES ($1, $1, $2, $3) ON CONFLICT DO NOTHING",
    [timestamp, follower, followed]
  ];
}

function removeFollow(timestamp, follower, followed) {
  return [
    "DELETE FROM follows WHERE follower=$1 and followed=$2",
    [follower, followed]
  ];
}

function addProducerReward(timestamp, producer, vestingShares) {
  return [
    "INSERT INTO producer_rewards (created_at, producer, vesting_shares) VALUES ($1, $2, $3)",
    [timestamp, producer, parseFloat(vestingShares)]
  ];
}

function addAuthorReward(
  timestamp,
  author,
  permlink,
  sbdPayout,
  steemPayout,
  vestingPayout
) {
  return [
    "INSERT INTO author_rewards (created_at, author, permlink, sbd_payout, steem_payout, vesting_payout) VALUES ($1, $2, $3, $4, $5, $6)",
    [
      timestamp,
      author,
      permlink,
      parseFloat(sbdPayout),
      parseFloat(steemPayout),
      parseFloat(vestingPayout)
    ]
  ];
}

function addCurationReward(
  timestamp,
  curator,
  reward,
  commentAuthor,
  commentPermlink
) {
  return [
    "INSERT INTO curation_rewards (created_at, curator, reward, comment_author, comment_permlink) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING",
    [timestamp, curator, parseFloat(reward), commentAuthor, commentPermlink]
  ];
}

module.exports = {
  tx,
  addUser,
  addPost,
  addComment,
  deletePost,
  addVote,
  addFollow,
  removeFollow,
  addProducerReward,
  addAuthorReward,
  addCurationReward
};
