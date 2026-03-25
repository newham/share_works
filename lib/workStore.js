/**
 * workStore.js
 * 作品数据存储在 data/works.csv
 * 字段: filename,title,desc,userHash,username,uploadedAt
 */
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');

const CSV_PATH = path.join(__dirname, '../data/works.csv');
const HEADER = ['filename', 'title', 'desc', 'userHash', 'username', 'uploadedAt'];

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

async function getAll() {
  const records = readAll();
  // 最新的在前
  return records.slice().reverse();
}

async function add(work) {
  const records = readAll();
  records.push(work);
  writeAll(records);
}

async function remove(filename) {
  const records = readAll().filter(r => r.filename !== filename);
  writeAll(records);
}

async function findByFilename(filename) {
  return readAll().find(r => r.filename === filename) || null;
}

module.exports = { getAll, add, remove, findByFilename };
