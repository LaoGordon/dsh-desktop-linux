<p align="right"><a href="./README.md">English</a> · <strong>中文</strong></p>

# DeepSeek Harness Desktop (dsh-desktop-linux)

> **来源声明** — 本仓库是 [`hzhe0083-source/deepseek-harness-desktop`](https://github.com/hzhe0083-source/deepseek-harness-desktop)（亦发布为 `anywhere-labs/deepseek-harness-desktop`）的**独立重命名发行版**，更名为 **dsh-desktop-linux**，以区别于 npm 上无关的 `dsh-desktop` 包。**并非 DeepSeek 官方项目。**
> - 原始项目：`deepseek-harness-desktop`（MIT）
> - 版本 `1.0.0` 是本发行版自己的版本号（上游基线：`0.5.1`）；因源码已修改，故与上游区分。
> - 上游：[hzhe0083-source/deepseek-harness-desktop](https://github.com/hzhe0083-source/deepseek-harness-desktop)
> - 已保留原始 MIT LICENSE 与版权声明，见 [LICENSE](LICENSE)。
> - **增强点**：桌面壳现支持 `DSH_DESKTOP_PATCH`、`DSH_DESKTOP_EXTRA_ARGS` 环境变量，让内置的 `dsh web` 通过 `--patch` 加载插件覆盖层；自动更新已指向**本仓库**（而非上游），因此更新后仍保留此增强。

## 下载与安装

### 方式一：下载预编译 AppImage（推荐）

下载 Release 的 AppImage 并校验 SHA-256：

```bash
wget https://github.com/LaoGordon/dsh-desktop-linux/releases/download/v1.0.0/DeepSeek-Harness-Desktop-1.0.0-linux-x86_64.AppImage
sha256sum DeepSeek-Harness-Desktop-1.0.0-linux-x86_64.AppImage
# 期望值: 55b87cd450bffb9610b7551904d00cbbcce750dc8fc5af7056277315cff2faff
chmod +x DeepSeek-Harness-Desktop-1.0.0-linux-x86_64.AppImage
./DeepSeek-Harness-Desktop-1.0.0-linux-x86_64.AppImage
```

### 方式一（附）：下载 .deb 包

想用系统包的话，下载 deb 并校验 SHA-256：

```bash
wget https://github.com/LaoGordon/dsh-desktop-linux/releases/download/v1.0.0/DeepSeek-Harness-Desktop-1.0.0-linux-amd64.deb
sha256sum DeepSeek-Harness-Desktop-1.0.0-linux-amd64.deb
# 期望值: f811663879043a611e13a38789746f0500f0f44cf19656c5f5d6f2218c2c0f2b
sudo apt install ./DeepSeek-Harness-Desktop-1.0.0-linux-amd64.deb
```

### 方式二：从源码构建

```bash
git clone https://github.com/LaoGordon/dsh-desktop-linux.git
cd dsh-desktop-linux
npm install
npm run dist:linux    # 产物输出到 dist/：AppImage + deb
# dist/DeepSeek-Harness-Desktop-1.0.0-linux-x86_64.AppImage
# dist/DeepSeek-Harness-Desktop-1.0.0-linux-amd64.deb
```

两种方式得到的是**同一个** AppImage（同名、同 SHA-256），且都包含 `DSH_DESKTOP_PATCH` 透传增强。

### 依赖

- Linux x86_64。
- **运行预编译 AppImage**：无需其他依赖——它自带 Electron，首次启动时会把固定的 `dsh` 运行时下载到用户数据目录（无需系统 Node/npm/dsh）。
- **从源码构建**：需要 Node.js 18+ 与 npm。
- 首次运行时 AppImage 会自动挂载；若缺少 `libfuse2` 会自动回退到 `--appimage-extract` 解包运行，无需手动解包。

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
      /path/to/DeepSeek-Harness-Desktop-1.0.0-linux-x86_64.AppImage "${outp[@]}"
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
DSH_DESKTOP_PATCH=/你的/cordis.yml ./DeepSeek-Harness-Desktop-1.0.0-linux-x86_64.AppImage
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

## 关于 AppImage 与源码构建

- 本仓库的 `main/main.js` 是**源码**，不是编译产物。唯一的小改动位于 `launchForPort()`（见 `DSH_DESKTOP_PATCH` / `DSH_DESKTOP_EXTRA_ARGS`）。
- Linux 下 AppImage 是只读 squashfs，首次运行会被挂载（必要时解包），增强就装在打包后的 `resources/app.asar` 里。
- 自动更新（electron-updater）已指向**本仓库**，因此更新来自本仓库并保留增强；上游原版 AppImage **不含**此补丁。

## 截图

| macOS | Linux |
| --- | --- |
| <img src="assets/screenshots/macos.jpg" alt="DeepSeek Harness Desktop on macOS" width="100%"> | <img src="assets/screenshots/linux.png" alt="DeepSeek Harness Desktop on Linux" width="100%"> |
