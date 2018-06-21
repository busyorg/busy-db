const Promise = require("bluebird");
const fs = require("fs-extra");
const path = require("path");
const os = require("os");
const chalk = require("chalk");
const { getBatch, getBatches } = require("../helpers/utils");
const db = require("./db");

const BASE_DIR = path.resolve(os.homedir(), "busydb");
const CACHE_DIR = path.resolve(BASE_DIR, "cache");
const MAX_BATCH = process.env.MAX_BATCH || 50;

async function processBlock(header, txs) {
  for (let tx of txs) {
    const [type, payload] = tx.op;
    const { timestamp } = tx;

    switch (type) {
      case "pow": {
        const auth = {
          weight_threshold: 1,
          account_auths: [],
          key_auths: [[payload.work.worker, 1]]
        };
        await db.addUser(
          timestamp,
          payload.worker_account,
          {},
          auth,
          auth,
          auth,
          payload.work.worker
        );
        break;
      }
      case "pow2": {
        let auth;
        let memoKey;
        if (payload.new_owner_key) {
          auth = {
            weight_threshold: 1,
            account_auths: [],
            key_auths: [[payload.new_owner_key, 1]]
          };
          memoKey = payload.new_owner_key;
        }
        await db.addUser(
          timestamp,
          payload.work[1].input.worker_account,
          {},
          auth,
          auth,
          auth,
          memoKey
        );
        break;
      }
      case "account_create":
      case "account_create_with_delegation": {
        let metadata = {};
        try {
          metadata = JSON.parse(payload.json_metadata);
        } catch (e) {} // eslint-disable-line no-empty
        await db.addUser(
          timestamp,
          payload.new_account_name,
          metadata,
          payload.owner,
          payload.active,
          payload.posting,
          payload.memo_key
        );
        break;
      }
      case "comment":
        if (!payload.parent_author) {
          let metadata = {};
          try {
            metadata = JSON.parse(payload.json_metadata);
          } catch (e) {} // eslint-disable-line no-empty
          await db.addPost(
            timestamp,
            payload.parent_permlink,
            payload.author,
            payload.permlink,
            payload.title,
            payload.body,
            metadata
          );
        } else {
          await db.addComment(
            timestamp,
            payload.parent_author,
            payload.parent_permlink,
            payload.author,
            payload.permlink,
            payload.body
          );
        }
        break;
      case "vote":
        await db.addVote(
          timestamp,
          payload.voter,
          payload.author,
          payload.permlink,
          payload.weight
        );
        break;
      case "delete_comment":
        await db.deletePost(timestamp, payload.author, payload.permlink);
        break;
      case "custom_json":
        if (payload.id === "follow") {
          const json = JSON.parse(payload.json);
          if (Array.isArray(json)) {
            switch (json[0]) {
              case "follow":
                await handleFollow(
                  timestamp,
                  json[1].follower,
                  json[1].following,
                  json[1].what
                );
                break;
              case "reblog":
                await db.addReblog(
                  timestamp,
                  json[1].account,
                  json[1].author,
                  json[1].permlink
                );
                break;
              default:
                console.log("Unhandled custom_json follow op", payload.json);
                break;
            }
          } else if (typeof json === "object") {
            if (json.follower && json.following && json.what) {
              await handleFollow(
                timestamp,
                json.follower,
                json.following,
                json.what
              );
            } else {
              console.log(
                "Unhandled custom_json follow op with json object",
                payload.json
              );
            }
          } else {
            console.log(
              "Unhandled custom_json follow op with unknown json format",
              payload.json
            );
          }
        } else {
          console.log("Unhandled custom_json op", payload);
        }
        break;
      case "producer_reward":
        await db.addProducerReward(
          timestamp,
          payload.producer,
          payload.vesting_shares
        );
        break;
      case "author_reward":
        await db.addAuthorReward(
          timestamp,
          payload.author,
          payload.permlink,
          payload.sbd_payout,
          payload.steem_payout,
          payload.vesting_payout
        );
        break;
      case "curation_reward":
        await db.addCurationReward(
          timestamp,
          payload.curator,
          payload.reward,
          payload.comment_author,
          payload.comment_permlink
        );
        break;
      case "transfer":
        await db.addTransfer(
          timestamp,
          payload.from,
          payload.to,
          payload.amount,
          payload.memo,
        );
        break;
      case "transfer_to_vesting":
        await db.addTransferToVesting(payload.from, payload.to, payload.amount);
        break;
      case "fill_vesting_withdraw":
        /* TODO {"from_account":"parachnen","to_account":"tard","withdrawn":"160.145659 VESTS","deposited":"0.078 STEEM"} */
        break;
      case "withdraw_vesting":
        /* TODO {"account":"steemit","vesting_shares":"260000.000000 VESTS"} */
        break;
      case "limit_order_create":
        /* TODO {"owner":"happychau123","orderid":120364126,"amount_to_sell":"226.222 SBD","min_to_receive":"196.714 STEEM","fill_or_kill":false,"expiration":"1903-08-13T16:38:24"} */
        break;
      case "fill_order":
        /* TODO {"current_owner":"happychau123","current_orderid":120364126,"current_pays":"226.222 SBD","open_owner":"olorin","open_orderid":1524697587,"open_pays":"196.714 STEEM"} */
        break;
      case "claim_reward_balance":
        await db.addClaimRewardBalance(
          payload.account,
          payload.reward_steem,
          payload.reward_sbd,
          payload.reward_vests
        );
        break;
      case "account_update": {
        let metadata = {};
        try {
          metadata = JSON.parse(payload.json_metadata);
        } catch (e) {} // eslint-disable-line no-empty
        await db.handleAccountUpdate(
          timestamp,
          payload.account,
          metadata,
          payload.owner,
          payload.active,
          payload.posting,
          payload.memo_key
        );
        break;
      }
      case "account_witness_proxy":
        /* TODO {"account":"bunkermining","proxy":"datasecuritynode"} */
        break;
      case "feed_publish":
        /* TODO {"publisher":"abit","exchange_rate":{"base":"1.000 SBD","quote":"1000.000 STEEM"}} */
        break;
      case "account_witness_vote":
        /* TODO {"account":"donalddrumpf","witness":"berniesanders","approve":true} */
        break;
      case "witness_update":
        /* TODO {"owner":"steempty","url":"fmooo/steemd-docker","block_signing_key":"STM8LoQjQqJHvotqBo7HjnqmUbFW9oJ2theyqonzUd9DdJ7YYHsvD","props":{"account_creation_fee":"100.000 STEEM","maximum_block_size":131072,"sbd_interest_rate":1000},"fee":"0.000 STEEM"} */
        break;
      case "delegate_vesting_shares":
        await db.addDelegateVestingShares(
          payload.delegator,
          payload.delegatee,
          payload.vesting_shares
        );
        break;
      case "return_vesting_delegation":
        await db.handleReturnVestingDelegation(
          payload.account,
          payload.vesting_shares
        );
        break;
      default:
        console.log("Unhandled op type", type, JSON.stringify(payload));
        break;
    }
  }
}

async function processBatch(batch) {
  for (let block of batch) {
    await processBlock(block.header, block.transactons);
  }
}

async function handleFollow(timestamp, follower, following, what) {
  if (what.length === 0) {
    await db.removeFollow(timestamp, follower, following);
  } else {
    await db.addFollow(timestamp, follower, following, what);
  }
}

async function syncOffline(head) {
  for (let i = 0; i <= head; i++) {
    if (i % 10 === 0) {
      console.log(chalk.blue(`Processing batch: ${i}`));
    }

    const resp = await fs.readFile(
      path.resolve(CACHE_DIR, `${i}.batch`),
      "utf8"
    );
    await processBatch(JSON.parse(resp));
  }

  console.log(chalk.green("Offline sync completed"));
}

async function syncOnline(head) {
  const batches = getBatches(1, 22910707, MAX_BATCH);

  const startBatch = head ? head + 1 : 0;

  for (let i = startBatch; i < batches.length; i++) {
    try {
      if (i % 10 === 0) {
        console.log(chalk.blue(`Processing batch: ${i}`));
      }
      const resp = await getBatch(batches[i]);
      await processBatch(resp);

      await fs.writeFile(
        path.resolve(CACHE_DIR, `${i}.batch`),
        JSON.stringify(resp)
      );
      await fs.writeFile(path.resolve(BASE_DIR, "head"), i);
    } catch (err) {
      console.log(err);
      await Promise.delay(2000);
      i--;
    }
  }
}

module.exports = async function sync(offline) {
  await fs.ensureDir(CACHE_DIR);
  await fs.ensureFile(path.resolve(BASE_DIR, "head"));
  const head = parseInt(
    await fs.readFile(path.resolve(BASE_DIR, "head"), "utf8")
  );

  console.log(chalk.yellow(`Current head is: ${chalk.bold(head)}`));

  if (offline) {
    syncOffline(head);
  } else {
    syncOnline(head);
  }
};
