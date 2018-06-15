const DiffMatchPatch = require("diff-match-patch");

const dmp = new DiffMatchPatch();

function getNewBody(oldBody, body) {
  let isPatch = false;
  let patch = null;

  try {
    patch = dmp.patch_fromText(body);
    isPatch = patch.length !== 0;
  } catch (err) {
    isPatch = false;
  }

  return isPatch ? dmp.patch_apply(patch, oldBody)[0] : body;
}

module.exports = {
  getNewBody
};
