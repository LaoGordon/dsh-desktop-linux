<p align="right"><a href="./README.md">English</a> · <strong>中文</strong></p>

# DeepSeek Harness Desktop

> **📦 来源声明** — 本仓库是 [`anywhere-labs/deepseek-harness-desktop`](https://github.com/anywhere-labs/deepseek-harness-desktop)（上游：`hzhe0083-source/deepseek-harness-desktop`）的**独立重命名发行版**，更名为 **dsh-desktop-linux**，以区别于 npm 上无关的 `dsh-desktop` 包。**并非** DeepSeek 官方项目。
> - 原始项目：`deepseek-harness-desktop`（MIT）
> - 上游：[hzhe0083-source/deepseek-harness-desktop](https://github.com/hzhe0083-source/deepseek-harness-desktop)
> - 已保留原始 MIT LICENSE 与版权声明，见 [LICENSE](LICENSE)。
> - **增强点**：桌面壳现支持 `DSH_DESKTOP_PATCH`、`DSH_DESKTOP_EXTRA_ARGS` 环境变量，让内置的 `dsh web` 通过 `--patch` 加载插件覆盖层。

## 下载与安装

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
# 运行（也可配合 DSH_DESKTOP_PATCH 加载插件，见下方"增强用法"）
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
> **此发行版已包含我们的 launchForPort patch**，与 GitHub 上游原版 `deepseek-harness-desktop` 不同——原版的 AppImage 不含此增强。

### 依赖

- Node.js 18+（本发行版可在首次启动时自动下载本地 LTS，不替换系统 Node）
- Linux (x86_64)。AppImage 首次运行自动挂载（缺 libfuse2 时自动 `--appimage-extract` 解包）。

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

因此 `DSH_DESKTOP_PATCH=/a/b.yml` 会让桌面壳真正以 `dsh web --patch /a/b.yml --host ... --port ...` 启动，从而加载你注册的插件。**端口仍是壳自动分配的随机值**（desktop 自行管理端口，无法经 `--port` 覆盖）。

### 关于源码与 AppImage

- 本仓库的 `main/main.js` 是**源码**。`launchForPort` 的改动在 `main/main.js`，是单一、小范围的源码补丁，后续合并上游更新时容易保留。
- 本发行版在 Linux 以 **AppImage** 分发（也可 `npm run dist:linux` 产出 deb）。AppImage 是只读 squashfs，**首次运行会被挂载（必要时 `--appimage-extract` 解包）**，增强就装在解包出的 `resources/app.asar` 里。
