# Share Works

学生 HTML 作品分享平台。基于 Node.js + Express，数据全部存储在本地 CSV 文件中，零外部依赖。

---

## 功能一览

- **无密码登录** — 直接输入用户名，系统自动以 MD5 hash 关联身份
- **作品展示** — 主页瀑布网格，卡片内嵌 iframe 实时预览，点击新窗口打开
- **上传作品** — 支持拖拽上传单个 HTML 文件（最大 5MB）
- **点赞 / 踩** — 登录用户可投，AJAX 无刷新，同方向重复点击取消
- **主题切换** — 11 种配色，localStorage 持久化
- **管理后台** — 访问 `/admin` 输入密钥，可删除任意作品

---

## 环境要求

- Node.js ≥ 16

---

## 安装依赖

```bash
npm install
```

---

## 运行程序

### 本地访问（默认，限本机）

```bash
node server.js
```

访问 **http://localhost:3000**

### 对外网开放（局域网 / 公网）

```bash
HOST=0.0.0.0 node server.js
```

这样所有能访问你机器 IP 的设备都能浏览和上传。
如果希望通过**域名**访问，请将 `0.0.0.0` 改为你的服务器公网 IP。

> ⚠️ **安全提示**：开放外网访问后，任何人都可以通过输入用户名登录并上传作品。管理密钥位于 `data/admin_token.txt`，请勿泄露。

---

## 目录结构

```
.
├── server.js          # Express 主服务
├── lib/
│   ├── userStore.js  # 用户数据（CSV）
│   ├── workStore.js  # 作品数据（CSV）
│   ├── voteStore.js  # 投票数据（CSV）
│   └── adminToken.js # 管理密钥生成/读取
├── views/             # EJS 模板
├── public/            # 静态资源（CSS / JS）
└── data/
    ├── users.csv      # 用户记录
    ├── works.csv      # 作品记录
    ├── votes.csv      # 投票记录
    ├── admin_token.txt # 管理密钥（首次自动生成）
    └── works/         # 上传的 HTML 文件
```

---

## 管理后台

1. 首次启动后密钥自动生成，查看方式：
   ```bash
   cat data/admin_token.txt
   ```
2. 访问 `http://localhost:3000/admin`（或对应 IP），输入密钥登录
3. 可删除任意用户的任意作品

---

## 注意事项

- 所有数据存储在 `data/` 目录下，请定期备份
- 上传文件最大 5MB，仅支持 `.html` 格式
- 上传页有提示：禁止上传违法、不道德作品
- 主题配色、登录状态存储在浏览器 localStorage / session 中
