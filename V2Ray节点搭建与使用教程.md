# 🚀 V2Ray 节点搭建与客户端使用全流程教程

> 本文整理自实测有效的 V2Ray 一键脚本搭建方案，涵盖服务器连接、服务端一键部署、BBR 加速验证、各平台（Windows / Android / iOS / macOS）客户端配置及常见问题排查。

---

## 目录
- [一、前置准备与环境要求](#一前置准备与环境要求)
- [二、连接 VPS 服务器](#二连接-vps-服务器)
  - [1. 电脑端连接 (Windows / macOS / Linux)](#1-电脑端连接-windows--macos--linux)
  - [2. 手机端连接 (ServerBox)](#2-手机端连接-serverbox)
- [三、服务端：V2Ray 一键安装与配置](#三服务端v2ray-一键安装与配置)
  - [1. 一键安装脚本](#1-一键安装脚本)
  - [2. 节点配置参数示例与核心要点](#2-节点配置参数示例与核心要点)
  - [3. V2Ray 服务端管理常用命令](#3-v2ray-服务端管理常用命令)
  - [4. BBR 网络加速验证](#4-bbr-网络加速验证)
- [四、客户端配置与使用教程](#四客户端配置与使用教程)
  - [1. Windows 端 (v2rayN)](#1-windows-端-v2rayn)
  - [2. Android 端 (v2rayNG)](#2-android-端-v2rayng)
  - [3. 其他平台客户端推荐 (iOS / macOS / Linux)](#3-其他平台客户端推荐-ios--macos--linux)
- [五、常见问题排查 (FAQ)](#五常见问题排查-faq)

---

## 一、前置准备与环境要求

1. **海外 VPS 服务器**：
   * 推荐操作系统：**Debian 10+**、**Ubuntu 20.04+** 或 **CentOS 7+**。
   * 获取 VPS 基本连接信息：**公网 IP 地址**、**SSH 端口**（默认 `22`）、**用户名**（通常为 `root`）和 **登录密码**。
2. **本地环境**：
   * 准备好 SSH 终端连接工具（Windows 自带 PowerShell/CMD、XShell、Termius、ServerBox 等）。

---

## 二、连接 VPS 服务器

### 1. 电脑端连接 (Windows / macOS / Linux)
打开终端（Windows 推荐使用 PowerShell 或 CMD）：

```bash
ssh root@你的服务器IP -p 22
```
*首次连接会提示 `Are you sure you want to continue connecting (yes/no)?`，输入 `yes` 并回车，然后输入服务器密码即可。*

### 2. 手机端连接 (ServerBox)
- **客户端获取**：
  - Android: [GitHub Releases (ServerBox)](https://github.com/lollipopkit/flutter_server_box/releases)
  - iOS: [App Store (ServerBox)](https://apps.apple.com/app/id1586449703)
- **配置流程**：
  1. 打开 ServerBox，点击右上角 `+` 新建主机。
  2. 主机填入 VPS 公网 IP，端口填 `22`，用户填 `root`，输入密码后保存。
  3. 点击进入 SSH 终端即可执行命令。

---

## 三、服务端：V2Ray 一键安装与配置

### 1. 一键安装脚本
登录 VPS 终端后，复制执行以下命令开始全自动安装（自动关闭防火墙冲突、自动配置 BBR）：

```bash
bash <(curl -s -L https://git.io/v2ray-setup.sh)
```

> **提示**：如需自定义端口、UUID、传输协议等高级设置，可使用自定义安装脚本：
> ```bash
> bash <(curl -s -L https://git.io/v2rayinstall.sh)
> ```

---

### 2. 节点配置参数示例与核心要点

安装完成后，终端会打印出类似下方的配置信息及 `vmess://` 节点链接：

```text
---------- V2Ray 配置信息 -------------

 地址 (Address) = 你的服务器外网IP
 端口 (Port) = 8080 (随机生成或自定)
 用户ID (UUID) = 20be1f8e-2169-4aa1-843e-5ead4250a9f7
 额外ID (Alter Id) = 0
 传输协议 (Network) = kcp
 伪装类型 (header type) = dtls

---------- END -------------

vmess://ewoidiI6I...（完整节点链接）
```

> ⚠️ **避坑关键点（重要）**：
> - 脚本默认生成的传输协议为 **`kcp`**，伪装类型为 **`dtls`**。
> - 客户端配置时传输协议和伪装类型**必须与服务端保持完全一致**，否则握手失败无法连通！
> - **强烈建议直接复制生成的 `vmess://...` 链接或二维码导入**，能最大程度避免手动配置手误。

---

### 3. V2Ray 服务端管理常用命令

| 常用命令 | 说明 |
| :--- | :--- |
| `v2ray info` | 查看当前 V2Ray 节点详细配置信息 |
| `v2ray config` | 修改 V2Ray 节点配置（端口、协议等） |
| `v2ray url` | 快速重新生成 `vmess://` 导入链接 |
| `v2ray qr` | 生成当前节点的配置二维码（方便手机扫码） |
| `v2ray status` | 查看 V2Ray 当前服务运行状态 |
| `v2ray start` | 启动 V2Ray 服务 |
| `v2ray stop` | 停止 V2Ray 服务 |
| `v2ray restart` | 重启 V2Ray 服务 |
| `v2ray log` | 查看实时运行日志（调试连接问题用） |
| `v2ray update` | 更新 V2Ray 核心至最新版 |
| `v2ray uninstall` | 完全卸载清理 V2Ray |

*配置文件所在绝对路径：`/etc/v2ray/config.json`*

---

### 4. BBR 网络加速验证

该一键脚本已内置开启 TCP BBR 拥塞控制算法。可通过以下命令检查是否生效：

```bash
lsmod | grep bbr
```

*若输出中包含 `tcp_bbr` 相关字段，即表示 BBR 已成功加载运行。*

---

## 四、客户端配置与使用教程

### 1. Windows 端 (v2rayN)

- **下载地址**：[GitHub Releases (v2rayN)](https://github.com/2dust/v2rayN/releases)  
  *(建议下载文件名含 Core 的完整压缩包，如 `v2rayN-Core.zip` 或 `zz_v2rayN-With-Core.zip`)*
- **导入与配置**：
  1. 解压后双击运行 `v2rayN.exe`，任务栏托盘出现蓝色 **V** 图标。
  2. **导入节点**：
     - **推荐方式**：复制 VPS 终端生成的 `vmess://...` 链接，切换到 v2rayN 界面按快捷键 `Ctrl + V`（或点击“服务器” -> “从剪贴板导入批量 URL”）。
     - **手动添加**：点击“服务器” -> “添加 [VMess] 服务器”：
       - **地址 (Address)**：VPS 的公网 IP
       - **端口 (Port)**：安装时分配的端口号
       - **用户 ID (UUID)**：安装生成的 UUID
       - **额外 ID (AlterId)**：`0`
       - **传输协议 (Network)**：选择 **`kcp`**
       - **伪装类型 (Header Type)**：选择 **`dtls`**
  3. **启用系统代理**：
     - 右键桌面右下角托盘区 **V** 图标：
       - **系统代理**：选择 **自动配置系统代理**
       - **路由模式**：选择 **绕开大陆 (绕过大陆/白名单)**
       - **活动服务器**：勾选刚刚添加的节点
  4. 打开浏览器访问 `https://www.google.com` 验证连通性。

---

### 2. Android 端 (v2rayNG)

- **下载地址**：[GitHub Releases (v2rayNG)](https://github.com/2dust/v2rayNG/releases)  
  *(主流安卓手机下载 `arm64-v8a.apk` 版本即可)*
- **导入与配置**：
  1. 打开 v2rayNG 应用。
  2. 点击右上角 **`+`** 号：
     - 若已复制节点链接，选择 **从剪贴板导入**。
     - 若使用服务端生成的二维码，选择 **扫描二维码**（在服务器端执行 `v2ray qr` 获取）。
     - 手动输入：选择 **手动输入[VMess]**，填写 IP、端口、UUID、AlterId(0)，并将“传输协议”选为 `kcp`，“伪装类型”选为 `dtls`。
  3. 保存节点后，选中该节点。
  4. 点击界面右下角的 **V 图标** 启动代理连接。

---

### 3. 其他平台客户端推荐 (iOS / macOS / Linux)

| 平台 | 推荐客户端 | 获取方式与说明 |
| :--- | :--- | :--- |
| **iOS** | **Shadowrocket (小火箭)** / Quantumult / Loon | 需登录美区/港区等非国区 Apple ID，在 App Store 购买下载 |
| **macOS** | [V2RayX](https://github.com/Cenmrev/V2RayX/releases) / [Clash Verge](https://github.com/clash-verge-rev/clash-verge-rev) | 开源免费，支持 VMess 订阅与节点导入 |
| **Linux** | [v2rayL](https://github.com/jiangxufeng/v2rayL/releases) / Qv2ray | 支持常见桌面发行版（Ubuntu/Debian/Arch） |

---

## 五、常见问题排查 (FAQ)

1. **连接超时 / 无法访问外网**：
   - 检查云厂商控制台（安全组 / 防火墙）是否放行了该节点对应的端口（注意：KCP 协议走的是 **UDP 端口**，需确保 UDP 与 TCP 均已放行）。
   - 在 VPS 终端输入 `v2ray status` 确认服务运行正常。
   - 输入 `v2ray log` 查看有无连接请求日志打出。
2. **协议不匹配导致握手失败**：
   - 再次确认客户端中的传输协议是否为 `kcp`、伪装类型是否为 `dtls`。
3. **无法下载 GitHub 客户端资源**：
   - 国内运营商 DNS 污染可能导致 GitHub 无法访问。可将本机 DNS 临时修改为公共 DNS（如 `114.114.114.114` 或 `8.8.8.8`），并在终端执行 `ipconfig /flushdns` 刷新缓存后再试。
