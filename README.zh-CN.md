<p align="right"><a href="./README.md">English</a> · <strong>中文</strong></p>

# DeepSeek Harness Desktop (dsh-desktop-linux)

> **来源声明** — 本仓库是 [`hzhe0083-source/deepseek-harness-desktop`](https://github.com/hzhe0083-source/deepseek-harness-desktop)（亦发布为 `anywhere-labs/deepseek-harness-desktop`）的**独立重命名发行版**，更名为 **dsh-desktop-linux**，以区别于 npm 上无关的 `dsh-desktop` 包。**并非 DeepSeek 官方项目。**
> - 原始项目：`deepseek-harness-desktop`（MIT）
> - 版本 `1.0.1` 是本发行版自己的版本号（上游基线：`0.5.1`）；因源码已修改，故与上游区分。自 v1.0.1 起，桌面壳**优先使用固定的托管 dsh 运行时**（校验缓存，否则自动下载），仅当托管运行时不可用时才回退到系统已安装的 dsh——因此完全不需要系统 Node/npm/dsh。
> - 上游：[hzhe0083-source/deepseek-harness-desktop](https://github.com/hzhe0083-source/deepseek-harness-desktop)
> - 已保留原始 MIT LICENSE 与版权声明，见 [LICENSE](LICENSE)。
> - **增强点**：桌面壳现支持 `DSH_DESKTOP_PATCH`、`DSH_DESKTOP_EXTRA_ARGS` 环境变量，让内置的 `dsh web` 通过 `--patch` 加载插件覆盖层；自动更新已指向**本仓库**（而非上游），因此更新后仍保留此增强。

## 下载与安装

### 方式一：下载 .deb 包（推荐）

下载 deb 并校验 SHA-256：

```bash
wget https://github.com/LaoGordon/dsh-desktop-linux/releases/download/v1.0.1/DeepSeek-Harness-Desktop-1.0.1-linux-amd64.deb
sha256sum DeepSeek-Harness-Desktop-1.0.1-linux-amd64.deb
# 期望值: dd59ad16cce6d5fc98fd2f59bcbf0e8bcb7c43c7caeccee98b2a06e340d5c448
sudo apt install ./DeepSeek-Harness-Desktop-1.0.1-linux-amd64.deb
```

### 方式二：预编译 AppImage（旧版本）

v1.0.1 之前的版本提供免安装的 AppImage：

```bash
wget https://github.com/LaoGordon/dsh-desktop-linux/releases/download/v1.0.0/DeepSeek-Harness-Desktop-1.0.0-linux-x86_64.AppImage
sha256sum DeepSeek-Harness-Desktop-1.0.0-linux-x86_64.AppImage
# 期望值: 55b87cd450bffb9610b7551904d00cbbcce750dc8fc5af7056277315cff2faff
chmod +x DeepSeek-Harness-Desktop-1.0.0-linux-x86_64.AppImage
./DeepSeek-Harness-Desktop-1.0.0-linux-x86_64.AppImage
```

### 方式三：从源码构建

```bash
git clone https://github.com/LaoGordon/dsh-desktop-linux.git
cd dsh-desktop-linux
npm install
npm run dist:linux    # 产物输出到 dist/：AppImage + deb
# dist/DeepSeek-Harness-Desktop-1.0.1-linux-x86_64.AppImage
# dist/DeepSeek-Harness-Desktop-1.0.1-linux-amd64.deb
```

所有发布产物均由此源码构建，且都包含 `DSH_DESKTOP_PATCH` 透传增强。注意 v1.0.1 只发布 deb（不含 AppImage 资产）。

### 依赖

- Linux x86_64。
- **运行应用**：无需其他依赖——它自带 Electron，首次启动时会把固定的 `dsh` 运行时下载到用户数据目录（无需系统 Node/npm/dsh）。仅当托管运行时无法解析时才回退到系统已安装的 dsh。
- **从源码构建**：需要 Node.js 18+ 与 npm。

## 增强用法：通过 `--patch` 加载自定义插件

原版桌面壳以固定命令启动内部的 `dsh web`。本发行版新增两个环境变量钩子，让你能加载自己的插件覆盖层：

| 环境变量 | 作用 |
|---|---|
| `DSH_DESKTOP_PATCH` | 若设置，则把 `--patch <值>` 注入内部 `dsh web` 命令 |
| `DSH_DESKTOP_EXTRA_ARGS` | 若设置，则追加任意额外参数（按 shell 规则分词、支持引号） |

### 补丁文件（cordis 覆盖层）

`--patch` 接收一个 cordis patch YAML，用于注册插件。最小示例（`~/cordis.yml`）：

```yaml
- insert:
    - id: my-plugin
      name: /absolute/path/to/plugin.js
    - id: another-plugin
      name: /absolute/path/to/plugin.ts
      config:
        some: option
```

本地插件文件请使用绝对路径；已安装的插件可使用 npm 包名。

### 方式 A：用 shell 函数包装 `dsh desktop`（推荐）

在 `~/.bashrc` 中加入以下内容，然后 `source ~/.bashrc`：

```bash
dsh() {
  if [ "$1" = "desktop" ]; then
    shift
    local patch=/home/<你>/cordis.yml            # ← 改成你的插件注册文件
    local outp=()
    while [ "$#" -gt 0 ]; do
      case "$1" in
        --patch) [ -n "$2" ] && patch="$2" && shift 2 || shift ;;
        *) outp+=("$1"); shift ;;
      esac
    done
    DSH_DESKTOP_PATCH="$patch" \
      /opt/DeepSeek\ Harness\ Desktop/deepseek-harness-desktop "${outp[@]}"  # deb 安装路径
  else
    command dsh "$@"
  fi
}
```

之后：

```bash
dsh desktop                              # 用默认的 ~/cordis.yml 加载插件
dsh desktop --patch /你的/其他.yml        # 指定插件覆盖层
dsh desktop --offline                    # 其余参数照常透传
```

### 方式 B：直接用环境变量

```bash
DSH_DESKTOP_PATCH=/你的/cordis.yml /opt/DeepSeek\ Harness\ Desktop/deepseek-harness-desktop
```

### 透传原理

内部启动的命令原本为：

```sh
dsh web --host 127.0.0.1 --port <随机空闲端口>
```

设置 `DSH_DESKTOP_PATCH=/a/b.yml` 后变为：

```sh
dsh web --patch /a/b.yml --host 127.0.0.1 --port <随机空闲端口>
```

端口仍由桌面壳自动分配，无法通过此机制覆盖。

## 关于桌面壳与源码构建

- 本仓库的 `main/main.js` 和 `main/runtime-manager.js` 是**源码**，不是编译产物。增强点位于 `launchForPort()`（`DSH_DESKTOP_PATCH` / `DSH_DESKTOP_EXTRA_ARGS`）和 `resolveRuntime()`（托管运行时优先：`DSH_BIN` → 托管缓存/下载 → 系统 dsh 兜底）。
- 自动更新（electron-updater）已指向**本仓库**，因此更新来自本仓库并保留增强；上游原版**不含**这些补丁。

## 截图

| macOS | Linux |
| --- | --- |
| <img src="assets/screenshots/macos.jpg" alt="DeepSeek Harness Desktop on macOS" width="100%"> | <img src="assets/screenshots/linux.png" alt="DeepSeek Harness Desktop on Linux" width="100%"> |
