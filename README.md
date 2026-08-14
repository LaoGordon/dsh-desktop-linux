<p align="right"><strong>English</strong> · <a href="./README.zh-CN.md">中文</a></p>

# DeepSeek Harness Desktop

> **📦 来源声明 / Provenance** — This repository is an **independent, renamed release** of [`anywhere-labs/deepseek-harness-desktop`](https://github.com/anywhere-labs/deepseek-harness-desktop) (upstream: `hzhe0083-source/deepseek-harness-desktop`), forked from upstream and rebranded to **dsh-desktop-linux** to distinguish it from the unrelated npm package `dsh-desktop`. It is **not** an official DeepSeek project.
> - Original project: `deepseek-harness-desktop` (MIT)
> - Upstream: [hzhe0083-source/deepseek-harness-desktop](https://github.com/hzhe0083-source/deepseek-harness-desktop)
> - Original MIT LICENSE and copyright are preserved (see [LICENSE](LICENSE)).
> - **Enhancement:** the desktop shell now honors `DSH_DESKTOP_PATCH` and `DSH_DESKTOP_EXTRA_ARGS` environment variables, letting the bundled `dsh web` load a plugin overlay via `--patch`.

## Download and install


### 方式 1：下载 Release 的 AppImage（推荐，含插件透传增强）

从 [GitHub Release v1.0.0](https://github.com/LaoGordon/dsh-desktop-linux/releases/download/v1.0.0/dsh-desktop-linux-x86_64.AppImage) 下载：

```bash
# 下载
wget https://github.com/LaoGordon/dsh-desktop-linux/releases/download/v1.0.0/dsh-desktop-linux-x86_64.AppImage
# (可选) 校验
sha256sum dsh-desktop-linux-x86_64.AppImage
# 期望 SHA256: 5bb6aafd073cbedd8160b6345a064da01c9f01e1e23bb170954837df18c7c402
# 加执行权限
chmod +x dsh-desktop-linux-x86_64.AppImage
# 运行（也可配合 DSH_DESKTOP_PATCH 加载插件，见下文）
./dsh-desktop-linux-x86_64.AppImage
```

### 方式 2：从源码构建 AppImage

```bash
git clone https://github.com/LaoGordon/dsh-desktop-linux.git
cd dsh-desktop-linux
npm install
npm run dist:linux     # 产出 AppImage + deb 到 dist/
```

> 两种方式得到的 AppImage 都含 `DSH_DESKTOP_PATCH` 透传增强（见下方"增强用法"）。
> **此 AppImage 已包含我们的 launchForPort patch**，与 GitHub 上游原版 deepseek-harness-desktop 不同——原版的 AppImage 不含此增强。

### 依赖

- Node.js 18+（本发行版可在首次启动时自动下载本地 LTS，不替换系统 Node）
- Linux (x86_64)。AppImage 首次运行自动挂载（缺 libfuse2 时自动 `--appimage-extract` 解包）。

## 增强用法：加载自定义插件（--patch 透传）

本发行版改进了桌面壳，让它能把外部 `--patch` 参数传给内部启动的 `dsh web`，从而加载你自己的插件覆盖层。

### 两种加载方式

**方式 A：用命令行包装 `dsh desktop`（推荐，无需改任何脚本）**

在 `~/.bashrc` 加一个 shell 函数，把 `dsh desktop` 统一处理（缺省用你的 `cordis.yml`，也支持手动指定）：

```bash
dsh() {
  if [ "$1" = "desktop" ]; then
    shift
    local patch=/home/<you>/cordis.yml           # ← 改成你的插件注册文件
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
dsh desktop --patch /your/other.yml           # 指定插件覆盖层
dsh desktop --offline                         # 其余参数照常透传
```

**方式 B：直接用环境变量**（不经 shell 函数，适合脚本/桌面快捷方式）

```bash
DSH_DESKTOP_PATCH=/your/cordis.yml ./DeepSeek-Harness-Desktop.0.5.0.AppImage
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
| `DSH_DESKTOP_EXTRA_ARGS` | 若设置，则追加任意额外参数（空格/引号分隔），如 `--trusted-host x` |

因此 `DSH_DESKTOP_PATCH=/a/b.yml` 会让桌面壳真正以 `dsh web --patch /a/b.yml --host ... --port ...` 启动，从而加载你注册的插件。**端口仍是壳自动分配的随机值，`--port` 无法由本机制覆盖**（desktop 自行管理端口）。

### 关于 AppImage 与源码构建

- **本仓库的 `main/main.js` 是源码**，不是编译产物。GitHub 上已有的 `*.AppImage` / `*.deb` 不含此 patch；**只有用本仓库源码重新构建、或下载本仓库发布的 Release 才会带增强**。
- 本发行版在 Linux 上是 **AppImage（或 deb）方式分发的**。AppImage 是只读 squashfs，**第一次运行时会被挂载/（必要时按 `--appimage-extract` 解包）**，本增强正是装在解包出的 `resources/app.asar` 里，不影响日常使用。
- 如需自己从本仓库构建带增强的 AppImage：

```sh
npm install
npm run dist:linux      # 产出 AppImage + deb 到 dist/
```

`launchForPort` 的改动在 `main/main.js`，是单一、小范围的源码补丁，后续合并上游更新时也容易保留。

## Screenshots

| macOS | Linux |
| --- | --- |
| <img src="assets/screenshots/macos.jpg" alt="DeepSeek Harness Desktop on macOS" width="100%"> | <img src="assets/screenshots/linux.png" alt="DeepSeek Harness Desktop on Linux" width="100%"> |
