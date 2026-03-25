/**
 * adminToken.js
 * 管理后台密钥：首次调用自动生成 32 位随机字符串，存入 data/admin_token.txt
 */
const fs   = require('fs');
const path = require('path');
const crypto = require('crypto');

const TOKEN_FILE = path.join(__dirname, '../data/admin_token.txt');

function getToken() {
  if (fs.existsSync(TOKEN_FILE)) {
    return fs.readFileSync(TOKEN_FILE, 'utf8').trim();
  }
  // 首次：生成 32 位十六进制随机字符串
  const token = crypto.randomBytes(16).toString('hex');
  fs.writeFileSync(TOKEN_FILE, token, 'utf8');
  return token;
}

module.exports = { getToken };
