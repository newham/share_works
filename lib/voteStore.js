/**
 * voteStore.js
 * 点赞/踩数据存储在 data/votes.csv
 * 字段: userHash, workFilename, vote(+1/-1), votedAt
 */
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');

const CSV_PATH = path.join(__dirname, '../data/votes.csv');
const HEADER   = ['userHash', 'workFilename', 'vote', 'votedAt'];

function readAll() {
  if (!fs.existsSync(CSV_PATH)) return [];
  const content = fs.readFileSync(CSV_PATH, 'utf8').trim();
  if (!content) return [];
  return parse(content, { columns: true, skip_empty_lines: true });
}

function writeAll(records) {
  const out = stringify(records, { header: true, columns: HEADER });
  fs.writeFileSync(CSV_PATH, out, 'utf8');
}

// 投票（首次投 or 切换）
// 返回 { likes, dislikes, userVote }
function vote(userHash, workFilename, value) {
  const records = readAll();
  const idx = records.findIndex(
    r => r.userHash === userHash && r.workFilename === workFilename
  );

  if (idx >= 0) {
    const existing = records[idx];
    if (existing.vote === String(value)) {
      // 点同方向，取消投票
      records.splice(idx, 1);
    } else {
      // 换方向
      records[idx].vote    = String(value);
      records[idx].votedAt = new Date().toISOString();
    }
  } else {
    // 新投票
    records.push({ userHash, workFilename, vote: String(value), votedAt: new Date().toISOString() });
  }

  writeAll(records);
}

// 获取某作品的所有投票信息 + 当前用户的投票状态
function getWorkVotes(workFilename, userHash) {
  const records = readAll();
  const votes   = records.filter(r => r.workFilename === workFilename);
  const likes   = votes.filter(r => r.vote === '1').length;
  const dislikes = votes.filter(r => r.vote === '-1').length;
  const userVote = userHash
    ? (votes.find(r => r.userHash === userHash)?.vote || null)
    : null;
  return { likes, dislikes, userVote };
}

// 批量获取多个作品的投票信息
function batchGetWorkVotes(filenames, userHash) {
  const result = {};
  filenames.forEach(f => { result[f] = getWorkVotes(f, userHash); });
  return result;
}

module.exports = { vote, getWorkVotes, batchGetWorkVotes };
