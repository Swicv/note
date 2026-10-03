# 🌌 Cosmo Note (星脉笔记)

> **极具设计感的个人私有化知识宇宙 · 原生双模部署 (Cloudflare & Docker) · 思源笔记式安全访问门禁 · 单笔记独立密码公网分享**

[![Deploy to Cloudflare](https://img.shields.io/badge/Deploy-Cloudflare%20Pages%20%2B%20D1-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://pages.cloudflare.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-purple?style=for-the-badge)](LICENSE)

---

## ✨ 核心特性与设计哲学

1. **思源笔记同源的私密访问门禁**
   - 摒弃繁琐的多租户用户中心、账号注册与邮箱验证流程。
   - 采用思源笔记经典的**单入口访问授权码（Master Access Code）**：首次启动引导设定，平时通过高质感毛玻璃锁屏门禁一键解锁。
   - 具备空闲超时自动锁定机制（可配置 15 分钟至永不锁定），离开电脑时隐私无忧。

2. **单笔记独立密码公网分享 (Per-Note Password Share)**
   - 每一篇笔记均可随时一键生成专属外部阅读直达链接（`/share/:slug`）。
   - **支持单篇独立访问密码**：可为敏感笔记单独设定独立密码（例如给朋友或同事设为 `123456`），访客无需获知您的主站授权码即可解锁阅读，且无法穿透访问您的任何其他私人笔记。
   - 访客端享有极简纯粹的沉浸式排版阅读页，附带章节大纲（TOC）、浏览计数、字数与预计阅读时间、一键复制 Markdown 与导出打印 PDF。

3. **Awwwards / Webby / FWA 获奖级视觉与微交互**
   - **品牌识别**：原创动态引力星轨 Logo 与脉冲恒星中枢。
   - **深空双色调**：Cosmic Abyss 星幕暗黑模式（深空黑底色搭配极光蓝、星际紫环境光晕）与 Solar Nebula 日光纸感浅色模式。
   - **动效反馈**：解锁与分享粒子彩带爆发、实时自动同步状态指示灯（Synced / Saving / Dirty）、密码错误震动警示。
   - **全键盘极速流**：`Cmd/Ctrl + K` 毫秒级全局模糊搜索、`Cmd/Ctrl + N` 秒建笔记、`Cmd/Ctrl + S` 手动即时保存。

4. **原生双模部署架构**
   - **Cloudflare 模式**：基于 Cloudflare Pages / Workers + Cloudflare D1 分布式数据库，享受全球边缘低延迟直出与免费 Serverless 托管。
   - **Docker 模式**：轻量级容器（< 100MB），内置 Better-SQLite3，挂载宿主机持久化卷 `./data:/data`，极速运行于本地 NAS、VPS 或个人电脑。
   - **同构数据**：SQLite 与 D1 采用 100% 相同的数据表结构，支持全量 JSON 备份与无缝互相迁移。

---

## 🚀 部署指南一：Docker 一键部署 (NAS / VPS / 本地)

### 方式 A：Docker Compose 启动 (推荐)

创建或进入项目目录，执行：

```bash
# 1. 启动容器 (自动映射本地 ./data 目录持久化数据库)
docker compose up -d

# 2. 浏览器打开
http://localhost:3000
```

`docker-compose.yml` 示例配置：
```yaml
services:
  cosmo-note:
    build: .
    container_name: cosmo-note
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
      - DB_PATH=/data/cosmo.db
      # - MASTER_PASSWORD=your-secure-code # 可选：环境变量预设访问码（或在初次网页打开时图形化设置）
      # - JWT_SECRET=your-random-secret    # 可选：自定义加密密钥
    volumes:
      - ./data:/data
```

### 方式 B：本地源码启动运行

```bash
# 安装依赖
pnpm install

# 生产环境编译
pnpm build

# 启动服务
pnpm start
# 服务将在 http://localhost:3000 启动
```

---

## ☁️ 部署指南二：Cloudflare Pages / Workers 零成本直出

利用 Cloudflare Pages 与 D1，您可以获得零服务器成本、全球分布式 CDN 托管的个人笔记系统。

### 步骤 1：创建 Cloudflare D1 数据库

在 Cloudflare 控制台或终端执行：

```bash
# 登录 Cloudflare
npx wrangler login

# 创建 D1 数据库
npx wrangler d1 create cosmo_note_db
```
执行后终端会输出类似于：
```toml
[[d1_databases]]
binding = "DB"
database_name = "cosmo_note_db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

### 步骤 2：更新 `wrangler.toml` 与初始化表结构

将上述生成的 `database_id` 填入项目根目录下的 `wrangler.toml` 中：

```toml
[[d1_databases]]
binding = "DB"
database_name = "cosmo_note_db"
database_id = "你的真实D1_DATABASE_ID"
```

初始化 D1 表结构：
```bash
npx wrangler d1 execute cosmo_note_db --file=./schema.sql
```

### 步骤 3：构建并发布到 Cloudflare Pages

```bash
# 1. 打包前端与 Cloudflare Worker
pnpm build:cf

# 2. 部署到 Cloudflare Pages
npx wrangler pages deploy dist --project-name cosmo-note
```

部署完成后，Cloudflare 将为您生成一个专属域名（例如 `https://cosmo-note.pages.dev`），支持绑定自定义域名！

---

## ⌨️ 常用快捷键一览

| 快捷键 | 功能 | 说明 |
| :--- | :--- | :--- |
| `Cmd/Ctrl + K` | 全局搜索 | 快速检索所有笔记标题与正文高亮片段 |
| `Cmd/Ctrl + N` | 新建笔记 | 瞬间在当前目录下创建灵感笔记 |
| `Cmd/Ctrl + S` | 立即保存 | 默认已开启 800ms 防抖无感自动保存 |
| `Esc` | 退出浮层 | 快速关闭搜索弹窗、设置或分享对话框 |

---

## 🛡️ 数据安全与备份迁移

- **访问授权码加密**：采用现代 Web Crypto API 原生 `PBKDF2-SHA256` 算法进行 50,000 次加盐迭代运算，绝不明文存储。
- **单笔记独立密码**：每篇笔记独立加盐存储，与主密码物理隔离。
- **全库备份**：点击工作台左下角「设置」图标 ->「数据备份与迁移」->「立即导出备份」，即可一键下载全量 JSON 档案。

---

*Cosmo Note · Crafted for thinkers, builders and stargazers.*
