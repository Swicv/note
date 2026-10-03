# 🌌 Cosmo Note (星脉笔记)

> **极具设计感的个人私有化知识宇宙 · 原生双模部署 (Cloudflare & Docker) · 思源笔记式安全访问门禁 · 单笔记独立密码公网分享**
>
> 🌐 **官方在线体验**：[https://cosmo-note.pages.dev](https://cosmo-note.pages.dev)  
> ✨ **创作者主页**：[https://666228.xyz](https://666228.xyz)

[![Deploy to Cloudflare](https://img.shields.io/badge/Deploy-Cloudflare%20Pages%20%2B%20D1-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://pages.cloudflare.com/)
[![Docker Image](https://img.shields.io/badge/Docker%20Hub-darkver8%2Fcosmo--note-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://hub.docker.com/r/darkver8/cosmo-note)
[![Platform](https://img.shields.io/badge/Platform-linux%2Famd64%20%7C%20linux%2Farm64-blue?style=for-the-badge&logo=linux&logoColor=white)](https://hub.docker.com/r/darkver8/cosmo-note)
[![License](https://img.shields.io/badge/License-MIT-purple?style=for-the-badge)](LICENSE)

---

## ✨ 核心特性与设计哲学

1. **思源笔记同源的私密访问门禁**
   - 彻底摒弃繁琐的多租户用户中心、账号注册与邮箱验证流程。
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
   - **Docker 模式**：官方提供 **AMD64 / ARM64 双架构** 镜像 `darkver8/note:latest`（或 `darkver8/cosmo-note:latest`，极轻量），挂载宿主机持久化卷 `./data:/data`，极速运行于群晖/威联通 NAS、极空间、绿联、树莓派、VPS 或本地电脑。
   - **同构数据**：SQLite 与 D1 采用 100% 相同的数据表结构，支持全量 JSON 备份与无缝互相迁移。

---

## 🐳 部署指南一：Docker 一键部署 (NAS / VPS / 本地)

官方镜像已全面支持 `linux/amd64` (x86_64 服务器 / PC) 与 `linux/arm64` (树莓派 / Apple Silicon / ARM 云服务器)。

### 方式 1：Docker 单行命令极速启动 (最简便)

```bash
docker run -d \
  --name cosmo-note \
  --restart unless-stopped \
  -p 3000:3000 \
  -v $(pwd)/cosmo-data:/data \
  darkver8/note:latest
```

启动完成后，打开浏览器访问：`http://你的服务器IP:3000` 即可进入！

---

### 方式 2：Docker Compose 启动 (推荐长期使用)

在任意目录下创建 `docker-compose.yml` 文件：

```yaml
version: "3.8"

services:
  cosmo-note:
    image: darkver8/cosmo-note:latest
    container_name: cosmo-note
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
      - DB_PATH=/data/cosmo.db
      # - MASTER_PASSWORD=your-secure-code # 可选：环境变量预设主访问授权码（若不填可在首次打开网页时图形化引导设置）
      # - JWT_SECRET=your-random-jwt-secret # 可选：自定义加密密钥
    volumes:
      - ./data:/data
```

启动服务：
```bash
docker compose up -d
```

---

### 方式 3：NAS 图形化界面部署 (群晖 Synology / 威联通 QNAP / 1Panel / 飞牛 fnOS)

1. 打开 NAS 的 Docker / Container 容器管理应用。
2. 搜索并下载镜像：`darkver8/cosmo-note`，标签选择 `latest`。
3. 创建容器：
   - **端口映射**：本地端口 `3000` -> 容器端口 `3000`。
   - **存储空间映射**：在 NAS 上新建文件夹（如 `docker/cosmo-note/data`），挂载路径填写 `/data`。
   - **环境配置**：可留空或添加 `PORT=3000`。
4. 点击启动，并在浏览器打开 `http://<NAS的IP>:3000` 即可使用！

---

## ☁️ 部署指南二：Cloudflare Pages / Workers 零成本直出

利用 Cloudflare Pages 与 D1，您可以获得全球分布式边缘加速、零服务器硬件成本的私有笔记库。

### 步骤 1：创建 Cloudflare D1 数据库

在终端执行：
```bash
# 登录 Cloudflare 账号
npx wrangler login

# 创建 D1 数据库 (APAC 区域)
npx wrangler d1 create cosmo_note_db
```
复制终端输出中的 `database_id`。

### 步骤 2：更新 `wrangler.toml` 与初始化表结构

将 `database_id` 填入 `wrangler.toml` 中，然后执行表结构迁移：
```bash
npx wrangler d1 execute cosmo_note_db --remote --file=./schema.sql
```

### 步骤 3：构建并发布到 Cloudflare Pages

```bash
# 打包前端与 Worker 边缘端
pnpm build:cf

# 发布到 Cloudflare Pages
npx wrangler pages deploy dist --project-name cosmo-note
```

发布完成后即可通过 Cloudflare 分配的全局域名（例如 `https://cosmo-note.pages.dev`）或者绑定您自己的自定义域名直接访问！

---

## ⌨️ 常用快捷键一览

| 快捷键 | 功能 | 说明 |
| :--- | :--- | :--- |
| `Cmd/Ctrl + K` | 全局搜索 | 毫秒级检索所有笔记标题与正文高亮片段 |
| `Cmd/Ctrl + N` | 新建笔记 | 瞬间在当前目录下创建灵感笔记 |
| `Cmd/Ctrl + S` | 立即保存 | 默认已开启 800ms 防抖无感自动保存 |
| `Esc` | 退出浮层 | 快速关闭搜索弹窗、设置或分享对话框 |

---

## 🛡️ 数据安全与备份迁移

- **访问授权码加密**：采用原生 Web Crypto API `PBKDF2-SHA256` 算法进行 50,000 次加盐迭代运算，绝不明文存储。
- **单笔记独立密码**：每篇笔记独立加盐存储，与主密码物理隔离。
- **全库备份**：点击工作台左下角「设置」图标 ->「数据备份与迁移」->「立即导出备份」，即可一键下载全量 JSON 档案。

---

## 👨‍💻 创作者与主页

- **作者主页**：[666228.xyz](https://666228.xyz)
- **代码仓库**：[GitHub - Swicv/note](https://github.com/Swicv/note)

*Cosmo Note · Dedicated to thinkers, builders and stargazers.*
