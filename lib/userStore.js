/**
 * userStore.js
 * 用户数据存储在 data/users.csv
 * 字段: hash,username,createdAt
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');

const CSV_PATH = path.join(__dirname, '../data/users.csv');
const HEADER = ['hash', 'username', 'createdAt'];

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

function hashUsername(username) {
  return crypto.createHash('md5').update(username.toLowerCase()).digest('hex').slice(0, 12);
}

async function findOrCreate(username) {
  const records = readAll();
  const hash = hashUsername(username);
  let user = records.find(r => r.hash === hash);
  if (!user) {
    user = { hash, username, createdAt: new Date().toISOString() };
    records.push(user);
    writeAll(records);
  }
  return user;
}

module.exports = { findOrCreate, readAll, hashUsername };
