<p align="right"><a href="./README.md">English</a> · <strong>中文</strong></p>

# DeepSeek Harness Desktop

> **📦 来源声明** — 本仓库是 [`anywhere-labs/deepseek-harness-desktop`](https://github.com/anywhere-labs/deepseek-harness-desktop)（上游：`hzhe0083-source/deepseek-harness-desktop`）的**独立重命名发行版**，更名为 **dsh-desktop-linux**，以区别于 npm 上无关的 `dsh-desktop` 包。**并非** DeepSeek 官方项目。
> - 原始项目：`deepseek-harness-desktop`（MIT）
> - 上游：[hzhe0083-source/deepseek-harness-desktop](https://github.com/hzhe0083-source/deepseek-harness-desktop)
> - 已保留原始 MIT LICENSE 与版权声明，见 [LICENSE](LICENSE)。
> - **增强点**：桌面壳现支持 `DSH_DESKTOP_PATCH`、`DSH_DESKTOP_EXTRA_ARGS` 环境变量，让内置的 `dsh web` 通过 `--patch` 加载插件覆盖层。


## 增强用法：加载自定义插件（--patch 透传）

本发行版改进了桌面壳，让它能把外部 `--patch` 参数传给内部启动的 `dsh web`，从而加载你自己的插件覆盖层。

### 两种加载方式

**方式 A：用命令行包装 `dsh desktop`（推荐，无需改任何脚本）**

在 `~/.bashrc` 加一个 shell 函数，把 `dsh desktop` 统一处理：

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
      /path/to/DeepSeek-Harness-Desktop.AppImage "${outp[@]}"
  else
    command dsh "$@"
  fi
}
```

之后：
```bash
dsh desktop                                   # 用默认 cordis.yml 加载插件
dsh desktop --patch /其他/插件.yml              # 指定插件覆盖层
dsh desktop --offline                         # 其余参数照常透传
```

**方式 B：直接用环境变量**（不经 shell 函数）

```bash
DSH_DESKTOP_PATCH=/你的/cordis.yml ./DeepSeek-Harness-Desktop.0.5.0.AppImage
```

### 透传原理

桌面壳内部启动的 dsh 命令原本固定为：

```sh
dsh web --host 127.0.0.1 --port <随机空闲端口>
```

本发行版在 `main/main.js` 的 `launchForPort` 里加了两个**环境变量钩子**：

| 环境变量 | 作用 |
|---|---|
| `DSH_DESKTOP_PATCH` | 若设置，则注入 `--patch <值>` 到内部的 `dsh web` 命令 |
| `DSH_DESKTOP_EXTRA_ARGS` | 若设置，则追加任意额外参数（空格/引号分隔） |

因此 `DSH_DESKTOP_PATCH=/a/b.yml` 会让桌面壳真正以 `dsh web --patch /a/b.yml --host ... --port ...` 启动，从而加载你注册的插件。**端口仍是壳自动分配的随机值**（desktop 自行管理端口）。

### 关于 AppImage 与源码构建

- 本仓库的 `main/main.js` 是**源码**，不是编译产物。GitHub 上已有的 `*.AppImage` / `*.deb` **不含此 patch**；只有用本仓库源码重新构建、或下载本仓库发布的 Release 才会带增强。
- 本发行版在 Linux 上以 **AppImage（或 deb）** 分发。AppImage 是只读 squashfs，**首次运行会被挂载（必要时 `--appimage-extract` 解包）**，本增强正是装在解包出的 `resources/app.asar` 里。
- 如需用本仓库源码构建带增强的 AppImage：

```sh
npm install
npm run dist:linux      # 产出 AppImage + deb 到 dist/
```

`launchForPort` 的改动在 `main/main.js`，是单一、小范围的源码补丁，后续合并上游更新时也容易保留。

## 下载与安装



在终端运行：

```sh
npx deepseek-harness-desktop
```

会先检查 Node.js 18+。如果没有安装或版本过旧，先下载一份本地 LTS（不会覆盖系统 Node），再启动应用：

```sh
# macOS / Linux
curl --proto '=https' --tlsv1.2 -fsSL \
  https://raw.githubusercontent.com/hzhe0083-source/deepseek-harness-desktop/main/setup.sh | sh

# Windows（PowerShell）
irm https://raw.githubusercontent.com/hzhe0083-source/deepseek-harness-desktop/main/setup.ps1 | iex
```

`npx` 会下载并启动最新桌面版，同时写入系统应用图标，之后可以从应用列表打开：

- macOS：挂载 dmg 并启动（加 `--install` 装进「应用程序」）
- Linux：下载 AppImage、写入 Ubuntu 应用菜单图标并启动；没有 libfuse2 时自动解包
- Windows：运行 portable 版（免安装）

npm 包只有几 KB，真正的安装包从 GitHub Releases 下载并缓存到本地。再次执行同一命令即可检查更新。

## 应用截图

| macOS | Linux |
| --- | --- |
| <img src="assets/screenshots/macos.jpg" alt="DeepSeek Harness Desktop on macOS" width="100%"> | <img src="assets/screenshots/linux.png" alt="DeepSeek Harness Desktop on Linux" width="100%"> |
