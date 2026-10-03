# FRP 内网穿透部署教程（Linux 服务端一键部署 + Windows 客户端）

> 本教程配套 GitHub 脚本仓库：`Swicv/sh`（基于 FRP `v0.69.0` 新版 `.toml` 语法编写）。
> 适用于：**Linux 云服务器一键安装服务端（frps）** + **Windows 电脑安装客户端（frpc）**，实现内网穿透（如远程桌面、本地网站暴露到公网等）。

---

## 一、脚本背景与选型说明

仓库 `Swicv/sh` 中包含两个服务端脚本：

| 脚本文件 | 运行模式 | 推荐等级 | 说明 |
| :--- | :--- | :--- | :--- |
| **`install-frps.sh`** | **systemd 系统服务** | ⭐⭐⭐⭐⭐ **(强烈推荐)** | Linux 标准服务守护，**开机自启、掉线自动拉起**，支持标准的系统管理命令。 |
| **`sh.sh`** | **nohup 后台进程** | ⭐⭐⭐ (备用) | 使用 `nohup` 放入后台，适合轻量 Docker 容器或无 systemd 的精简系统。 |

> **默认预设参数**：
> - FRP 版本：`0.69.0`
> - 服务端通信端口：`7000`
> - 认证 Token：`ai123456`
> - Web 仪表盘控制台：`http://服务器IP:7500`（账号：`admin`，密码：`ai123456`）

---

## 二、Linux 服务端部署（纯小白一键操作）

### 步骤 1：开放云服务器安全组端口（核心必做）

> ⚠️ **新手踩坑第一名**：云服务器（腾讯云、阿里云、华为云、AWS等）自带外部防火墙（安全组），**必须先放行端口**，否则 100% 无法连通！

请进入云厂商控制台的 **安全组 / 防火墙**，添加如下 **TCP 入方向** 规则：

| 端口号 | 协议 | 用途说明 |
| :--- | :--- | :--- |
| **7000** | TCP | FRP 服务端通信端口（frpc 客户端连接此端口） |
| **7500** | TCP | FRP 控制台 Dashboard 仪表盘（网页监控） |
| **7001** (按需) | TCP | 示例映射端口（如 Windows 远程桌面映射到公网的端口） |

---

### 步骤 2：在 Linux 终端执行一键命令

使用 SSH 连接工具（如 Xshell、FinalShell 或云控制台的 WebShell）登录你的 Linux 服务器，直接复制下方命令执行：

#### 方案 A：默认配置一键部署（最快推荐）
```bash
curl -fsSL https://raw.githubusercontent.com/Swicv/sh/main/install-frps.sh | sudo bash
```

> **提示**：如果国内服务器访问 GitHub 遇到网络波动，可先克隆仓库再执行：
> ```bash
> git clone https://github.com/Swicv/sh.git && cd sh && sudo bash install-frps.sh
> ```

#### 方案 B：自定义 Token 与仪表盘密码部署
如果需要自定义密码，可通过环境变量传入参数：
```bash
curl -fsSL https://raw.githubusercontent.com/Swicv/sh/main/install-frps.sh | sudo FRP_TOKEN="你的自定义Token" DASHBOARD_PASSWORD="你的仪表盘密码" bash
```

---

### 步骤 3：验证服务端状态

脚本运行完成后，如果看到类似如下输出，即代表安装成功：
```text
frps 部署完成
客户端端口：7000
Dashboard：http://xxx.xxx.xxx.xxx:7500
Dashboard 账号：admin
Dashboard 密码：ai123456
frp Token：ai123456
```

此时打开电脑浏览器，访问 `http://你的云服务器公网IP:7500`，输入控制台账号密码，能成功登录即说明一切正常。

#### 常用维护命令速查
- **查看运行状态**：`sudo systemctl status frps`
- **重启服务**：`sudo systemctl restart frps`
- **停止服务**：`sudo systemctl stop frps`
- **查看日志**：`sudo journalctl -u frps -f`
- **配置文件路径**：`/etc/frp/frps.toml`（修改配置后需执行 `sudo systemctl restart frps` 生效）

---

## 三、Windows 客户端配置与启动

### 步骤 1：下载并解压客户端
1. 打开浏览器下载配套的 Windows 64位客户端程序：
   - 官方直连下载：[frp_0.69.0_windows_amd64.zip](https://github.com/fatedier/frp/releases/download/v0.69.0/frp_0.69.0_windows_amd64.zip)
2. 解压压缩包，建议将解压后的文件夹重命名为 `frp` 并放置在固定位置（如 `C:\frp` 或 `D:\frp`）。
3. 文件夹中包含多个文件，在 Windows 客户端机上**仅需保留两个核心文件**：
   - `frpc.exe`（客户端主程序）
   - `frpc.toml`（客户端配置文件）
   *(其它 `frps.*` 文件为服务端文件，可直接删除)*

> ⚠️ **防报毒提示**：
> FRP 作为内网穿透工具，Windows Defender 或第三方杀毒软件偶有误报。若 `frpc.exe` 被拦截或删除，请在 Windows 安全中心（病毒和威胁防护 -> 管理设置 -> 排除项）将 `frp` 整个文件夹加入白名单。

---

### 步骤 2：编辑配置文件 `frpc.toml`

用记事本打开 `C:\frp\frpc.toml`，将全部内容替换为如下模板，并修改对应的 IP 与 Token：

```toml
# ================= 服务端连接设置 =================
serverAddr = "123.123.123.123"    # 替换为你 Linux 云服务器的公网 IP
serverPort = 7000                  # 服务端端口，默认为 7000
auth.method = "token"
auth.token = "ai123456"            # 与服务端一致的 Token（默认 ai123456）

# ================= 场景一：Windows 远程桌面穿透 (RDP) =================
# 实现外网访问这台 Windows 电脑的远程桌面
[[proxies]]
name = "win-rdp"                   # 隧道名称（全服唯一，不能与其他人重复）
type = "tcp"
localIP = "127.0.0.1"
localPort = 3389                   # Windows 远程桌面本地默认端口
remotePort = 7001                  # 映射到云服务器的端口（记得在云服务器安全组放行 7001！）

# ================= 场景二：本地 Web/API 服务穿透（按需启用） =================
# [[proxies]]
# name = "win-web"
# type = "tcp"
# localIP = "127.0.0.1"
# localPort = 8080                 # 本地运行的 Web 服务端口
# remotePort = 8088                # 映射到公网的端口（云服务器安全组需放行 8088）
```
修改完成后，按 `Ctrl + S` 保存文件。

---

### 步骤 3：测试启动（命令提示符）

1. 进入 `C:\frp` 文件夹。
2. 在文件资源管理器上方的**地址栏直接输入 `cmd` 并按下回车**。
3. 在弹出的黑底窗口中输入：
   ```cmd
   frpc.exe -c frpc.toml
   ```
4. **验证连接状态**：
   - 如果终端输出包含 `[login to server success]` 以及 `[win-rdp] start proxy success`，即代表穿透成功！
   - 按 `Ctrl + C` 可退出测试。

---

### 步骤 4：配置无黑窗口静默后台运行与开机自启动

为了避免长期挂着 CMD 黑窗口被误关，建议使用轻量 VBS 脚本实现后台无感运行：

#### 1. 创建后台静默启动脚本
在 `C:\frp` 文件夹内，右键新建一个文本文档，重命名为 **`start_frpc.vbs`**（注意需显示文件后缀名，避免存为 `.vbs.txt`）。

用记事本打开 `start_frpc.vbs`，填入以下两行代码并保存：
```vbs
Set ws = CreateObject("Wscript.Shell")
ws.run "frpc.exe -c frpc.toml", 0
```
*(末尾的 `0` 代表完全隐藏运行窗口)*

双击 `start_frpc.vbs`，即可实现无黑窗口在后台默默运行。

#### 2. 添加开机自动启动
1. 键盘按下 `Win + R` 键，输入：
   ```text
   shell:startup
   ```
   点击“确定”，系统会打开【启动】目录。
2. 回到 `C:\frp` 目录，右键 `start_frpc.vbs` -> 选择 **“创建快捷方式”**。
3. 将生成的快捷方式复制或剪切到刚才打开的【启动】文件夹中。
4. 以后每次电脑开机进入系统，FRP 就会自动静默自启。

> **如何手动停止后台运行的 frpc？**
> 按下快捷键 `Ctrl + Shift + Esc` 打开任务管理器，切换到“详细信息”或“进程”，找到 `frpc.exe`，右键点击“结束任务”即可。

---

## 四、常见问题与避坑清单 (Checklist)

| 报错或异常现象 | 排查方向 | 解决方案 |
| :--- | :--- | :--- |
| `connection timed out` / 连接超时 | 云服务器安全组未开放端口 | 确认云厂商安全组放行了 **TCP 7000** 端口。 |
| `authorization failed` | Token 验证失败 | 确认客户端 `frpc.toml` 中的 `auth.token` 与服务端完全一致。 |
| `port already used` | 映射端口冲突 | 云服务器上的 `remotePort`（如 7001）已被占用，在 `frpc.toml` 里换一个端口。 |
| 远程桌面连接提示“无法连接” | 本地系统未开启远程桌面 | Windows 电脑需开启远程桌面：打开“设置” -> “系统” -> “远程桌面” -> 开启开关。连接地址格式为：`云服务器公网IP:7001`。 |
| 双击启动提示找不到文件 | 路径或扩展名错误 | 确认 `frpc.exe` 和 `frpc.toml` 位于同一目录下，且没有误存成 `frpc.toml.txt`。 |
