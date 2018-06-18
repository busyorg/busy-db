CREATE TABLE accounts (
  created_at TIMESTAMP,
  name VARCHAR(60) UNIQUE
);

CREATE TABLE posts (
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  category VARCHAR(255),
  author VARCHAR(16),
  permlink VARCHAR(255),
  title VARCHAR(255),
  body TEXT,
  CONSTRAINT uc_post UNIQUE (author, permlink)
);

CREATE TABLE comments (
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  parent_author VARCHAR(32),
  parent_permlink VARCHAR(255),
  author VARCHAR(32),
  permlink VARCHAR(255),
  body TEXT,
  CONSTRAINT uc_comment UNIQUE (author, permlink)
);

CREATE TABLE votes (
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  post_author VARCHAR(16),
  post_permlink VARCHAR(255),
  voter VARCHAR(16) NOT NULL,
  weight SMALLINT DEFAULT 0,
  CONSTRAINT uc_vote UNIQUE (post_author, post_permlink, voter)
);

CREATE TABLE follows (
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  follower VARCHAR(16),
  followed VARCHAR(16),
  CONSTRAINT uc_follow UNIQUE (follower, followed)
);

CREATE TABLE communities (
  account_id DECIMAL NOT NULL,
  type SMALLINT,
  name VARCHAR(16),
  about VARCHAR(512),
  description VARCHAR(5000),
  language VARCHAR(10),
  is_nsfw BOOLEAN
);

CREATE TABLE members (
  community_id DECIMAL NOT NULL,
  account_id DECIMAL NOT NULL,
  is_admin BOOLEAN,
  is_mod BOOLEAN,
  is_approved BOOLEAN,
  is_muted BOOLEAN,
  title VARCHAR(100)
);

CREATE TABLE flags (
  account_id DECIMAL NOT NULL,
  community_id DECIMAL NOT NULL,
  post_id DECIMAL NOT NULL,
  notes VARCHAR(240)
);

CREATE TABLE modlogs (
  account_id DECIMAL NOT NULL,
  community_id DECIMAL NOT NULL,
  action SMALLINT,
  params VARCHAR(100)
);

CREATE TABLE producer_rewards (
  created_at TIMESTAMP,
  producer VARCHAR(16),
  vesting_shares DECIMAL(24,6)
);

CREATE TABLE author_rewards (
  created_at TIMESTAMP,
  author VARCHAR(16),
  permlink VARCHAR(255),
  sbd_payout DECIMAL(7,3),
  steem_payout DECIMAL(7,3),
  vesting_payout DECIMAL(24,6)
);

CREATE TABLE curation_rewards (
  created_at TIMESTAMP,
  curator VARCHAR(16),
  reward DECIMAL(24,6),
  comment_author VARCHAR(16),
  comment_permlink VARCHAR(255),
  CONSTRAINT uc_curation_reward UNIQUE (curator, comment_author, comment_permlink)
);

CREATE TABLE reblogs (
  created_at TIMESTAMP,
  account VARCHAR(16) NOT NULL,
  author VARCHAR(16),
  permlink VARCHAR(255)
);
