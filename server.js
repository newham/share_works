const express = require('express');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const userStore    = require('./lib/userStore');
const workStore    = require('./lib/workStore');
const voteStore    = require('./lib/voteStore');
const adminToken   = require('./lib/adminToken');

const app = express();
const PORT = 3000;

// ─── 确保数据目录存在 ─────────────────────────────────────────────
const DATA_DIR = path.join(__dirname, 'data');
const WORKS_DIR = path.join(DATA_DIR, 'works');
[DATA_DIR, WORKS_DIR].forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });

// ─── 模板引擎 ─────────────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ─── 中间件 ───────────────────────────────────────────────────────
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'share-works-secret-2026',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 } // 7天
}));

// 静态提供 data/works 目录（用于直接访问 HTML 作品）
app.use('/works', express.static(WORKS_DIR));

// ─── 工具函数 ─────────────────────────────────────────────────────
function requireLogin(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  next();
}

// ─── 路由：登录 ───────────────────────────────────────────────────
app.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/');
  res.render('login', { error: null });
});

app.post('/login', async (req, res) => {
  const username = (req.body.username || '').trim();
  if (!username) return res.render('login', { error: '请输入用户名' });
  if (!/^[\w\u4e00-\u9fa5]{1,20}$/.test(username)) {
    return res.render('login', { error: '用户名只能包含字母、数字、中文，且不超过20个字符' });
  }
  const user = await userStore.findOrCreate(username);
  req.session.user = user;
  res.redirect('/');
});

app.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

// ─── 路由：admin ──────────────────────────────────────────────────
app.get('/admin', (req, res) => {
  if (req.session.isAdmin) return res.redirect('/admin/panel');
  res.render('admin-login', { error: null });
});

app.post('/admin', (req, res) => {
  const { token } = req.body;
  const valid = adminToken.getToken();
  if (token !== valid) {
    return res.render('admin-login', { error: '密钥错误，请重试' });
  }
  req.session.isAdmin = true;
  res.redirect('/admin/panel');
});

app.get('/admin/panel', async (req, res) => {
  if (!req.session.isAdmin) return res.redirect('/admin');
  const works = await workStore.getAll();
  res.render('admin-panel', { works, error: null });
});

app.post('/admin/delete/:filename', async (req, res) => {
  if (!req.session.isAdmin) return res.status(403).send('无权操作');
  const { filename } = req.params;
  const work = await workStore.findByFilename(filename);
  if (!work) return res.status(404).send('作品不存在');
  // 删除文件
  const filePath = path.join(WORKS_DIR, filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  await workStore.remove(filename);
  res.redirect('/admin/panel');
});

app.post('/admin/logout', (req, res) => {
  req.session.isAdmin = false;
  res.redirect('/admin');
});

// 显示 admin token（仅首次，或按需提供接口查看）
app.get('/admin/token', (req, res) => {
  // 不鉴权，仅本地调试用；正式可删除此路由
  const token = adminToken.getToken();
  res.send(`当前后台密钥：<b>${token}</b><br>已保存在 data/admin_token.txt`);
});

// ─── 路由：主页 ───────────────────────────────────────────────────
app.get('/', async (req, res) => {
  const works = await workStore.getAll();
  const userHash = req.session.user?.hash || null;
  const filenames = works.map(w => w.filename);
  const voteMap = voteStore.batchGetWorkVotes(filenames, userHash);
  // 把投票信息合并到每个 work 对象
  works.forEach(w => {
    w.likes     = voteMap[w.filename]?.likes     ?? 0;
    w.dislikes  = voteMap[w.filename]?.dislikes  ?? 0;
    w.userVote  = voteMap[w.filename]?.userVote  ?? null;
  });
  res.render('index', { user: req.session.user || null, works });
});

// ─── 路由：上传页 ─────────────────────────────────────────────────
app.get('/upload', requireLogin, (req, res) => {
  res.render('upload', { user: req.session.user, error: null });
});

// Multer 配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, WORKS_DIR),
  filename: (req, file, cb) => {
    const userHash = req.session.user.hash;
    const ts = Date.now();
    // 保留原始文件名（安全处理），加 hash 前缀防冲突
    const safeName = file.originalname.replace(/[^a-zA-Z0-9_.\-\u4e00-\u9fa5]/g, '_');
    cb(null, `${userHash}_${ts}_${safeName}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() !== '.html') {
      return cb(new Error('只允许上传 .html 文件'));
    }
    cb(null, true);
  }
});

app.post('/upload', requireLogin, (req, res, next) => {
  upload.single('htmlfile')(req, res, async (err) => {
    if (err) {
      return res.render('upload', { user: req.session.user, error: err.message });
    }
    if (!req.file) {
      return res.render('upload', { user: req.session.user, error: '请选择一个 HTML 文件' });
    }

    const title = (req.body.title || '').trim() || path.basename(req.file.originalname, '.html');
    const desc  = (req.body.desc  || '').trim().slice(0, 200);

    await workStore.add({
      filename: req.file.filename,
      title,
      desc,
      userHash: req.session.user.hash,
      username: req.session.user.username,
      uploadedAt: new Date().toISOString()
    });

    res.redirect('/');
  });
});

// ─── 路由：统计页 ──────────────────────────────────────────────────
app.get('/stats', async (req, res) => {
  const works = await workStore.getAll();
  const filenames = works.map(w => w.filename);
  const voteMap = voteStore.batchGetWorkVotes(filenames, null);
  const stats = works.map(w => ({
    filename: w.filename,
    title:    w.title,
    username: w.username,
    likes:    voteMap[w.filename]?.likes    ?? 0,
    dislikes: voteMap[w.filename]?.dislikes ?? 0,
    score:   (voteMap[w.filename]?.likes ?? 0) - (voteMap[w.filename]?.dislikes ?? 0)
  })).sort((a, b) => b.score - a.score);
  res.render('stats', { stats });
});

// ─── 路由：点赞/踩 ─────────────────────────────────────────────────
app.post('/vote', requireLogin, (req, res) => {
  const { filename, value } = req.body;
  if (!filename || !['1', '-1'].includes(String(value))) {
    return res.status(400).json({ ok: false, error: '参数错误' });
  }
  voteStore.vote(req.session.user.hash, filename, Number(value));
  const { likes, dislikes } = voteStore.getWorkVotes(filename, null);
  res.json({ ok: true, likes, dislikes });
});

// ─── 路由：删除作品（仅限本人）────────────────────────────────────
app.post('/delete/:filename', requireLogin, async (req, res) => {
  const { filename } = req.params;
  const work = await workStore.findByFilename(filename);
  if (!work || work.userHash !== req.session.user.hash) {
    return res.status(403).send('无权删除');
  }
  // 删除文件
  const filePath = path.join(WORKS_DIR, filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  await workStore.remove(filename);
  res.redirect('/');
});

// ─── 启动 ─────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Share Works 已启动：http://localhost:${PORT}`);
});
