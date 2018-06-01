CREATE TABLE accounts (
  created_at TIMESTAMP,
  name VARCHAR(60) UNIQUE
);

CREATE TABLE posts (
  id SERIAL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  author VARCHAR(32),
  permlink VARCHAR(255),
  title VARCHAR(255),
  body TEXT,
  CONSTRAINT uc_post UNIQUE (author, permlink)
);

CREATE TABLE votes (
  id SERIAL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  post_id DECIMAL NOT NULL,
  voter VARCHAR(32) NOT NULL,
  weight SMALLINT DEFAULT 0,
  CONSTRAINT uc_vote UNIQUE (post_id, voter)
);

CREATE TABLE communities (
  account_id DECIMAL NOT NULL,
  type SMALLINT,
  name VARCHAR(32),
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
