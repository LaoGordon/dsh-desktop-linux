<p align="right"><strong>English</strong> · <a href="./README.zh-CN.md">中文</a></p>

# DeepSeek Harness Desktop (dsh-desktop-linux)

> **Provenance** — This is an **independent, renamed release** of [`hzhe0083-source/deepseek-harness-desktop`](https://github.com/hzhe0083-source/deepseek-harness-desktop) (also published as `anywhere-labs/deepseek-harness-desktop`). It is rebranded **dsh-desktop-linux** to distinguish it from the unrelated npm package `dsh-desktop`. **It is not an official DeepSeek project.**
> - Original project: `deepseek-harness-desktop` (MIT)
> - Version `1.0.2` is this release's own version number (upstream base: `0.5.1`); it is distinct because the source is modified. The shell prefers its pinned managed `dsh` runtime (verified cache, else download) and only falls back to a machine-installed dsh, so it runs without any system Node/npm/dsh.
> - Upstream: [hzhe0083-source/deepseek-harness-desktop](https://github.com/hzhe0083-source/deepseek-harness-desktop)
> - The original MIT LICENSE and copyright are preserved (see [LICENSE](LICENSE)).
> - **Enhancement:** the desktop shell honors `DSH_DESKTOP_PATCH` and `DSH_DESKTOP_EXTRA_ARGS`, so the bundled `dsh web` can load a plugin overlay via `--patch`. Auto-update is now pointed at **this** repository (not upstream), so updates keep the enhancement.

## Download & install

### Option 1 — Download the .deb package (recommended)

Grab the deb and verify its SHA-256:

```bash
wget https://github.com/LaoGordon/dsh-desktop-linux/releases/download/v1.0.2/DeepSeek-Harness-Desktop-1.0.2-linux-amd64.deb
sha256sum DeepSeek-Harness-Desktop-1.0.2-linux-amd64.deb
# expected: 474eca849cd95db92e8c3db5342a356bfde713389459ed6de43af27a33e543b1
sudo apt install ./DeepSeek-Harness-Desktop-1.0.2-linux-amd64.deb
```

### Option 2 — Build from source

```bash
git clone https://github.com/LaoGordon/dsh-desktop-linux.git
cd dsh-desktop-linux
npm install
npm run dist:linux    # outputs the deb into dist/
# dist/DeepSeek-Harness-Desktop-1.0.2-linux-amd64.deb
```

All release artifacts are built from this source and include the `DSH_DESKTOP_PATCH` pass-through enhancement. The deb is the only distribution format for Linux.

### Requirements

- Linux x86_64.
- **To run the app:** nothing else is required — it bundles Electron and self-downloads a pinned `dsh` runtime into the user-data directory on first launch (no system Node/npm/dsh needed). A machine-installed `dsh` is only a fallback if the managed runtime cannot be resolved.
- **To build from source:** Node.js 18+ and npm.

## Enhanced usage — load custom plugins via `--patch`

The stock desktop shell launches an internal `dsh web` with a fixed command. This release adds two environment-variable hooks so you can load your own plugin overlay:

| Environment variable | Effect |
|---|---|
| `DSH_DESKTOP_PATCH` | If set, injects `--patch <value>` into the internal `dsh web` command |
| `DSH_DESKTOP_EXTRA_ARGS` | If set, appends arbitrary extra args (shell-split, quote-aware) |

### The patch file (a cordis overlay)

`--patch` takes a cordis patch YAML that registers plugins. Minimal example (`~/cordis.yml`):

```yaml
- insert:
    - id: my-plugin
      name: /absolute/path/to/plugin.js
    - id: another-plugin
      name: /absolute/path/to/plugin.ts
      config:
        some: option
```

Use absolute paths for local plugin files, or npm package names for installed plugins.

### Method A — shell wrapper for `dsh desktop` (recommended)

Add this to `~/.bashrc`, then `source ~/.bashrc`:

```bash
dsh() {
  if [ "$1" = "desktop" ]; then
    shift
    local patch=/home/<you>/cordis.yml            # ← your plugin registration file
    local outp=()
    while [ "$#" -gt 0 ]; do
      case "$1" in
        --patch) [ -n "$2" ] && patch="$2" && shift 2 || shift ;;
        *) outp+=("$1"); shift ;;
      esac
    done
    DSH_DESKTOP_PATCH="$patch" \
      /opt/DeepSeek\ Harness\ Desktop/deepseek-harness-desktop "${outp[@]}"  # deb install path
  else
    command dsh "$@"
  fi
}
```

Then:

```bash
dsh desktop                              # loads the default ~/cordis.yml
dsh desktop --patch /your/other.yml      # loads a specific overlay
dsh desktop --offline                    # other args pass through unchanged
```

### Method B — environment variable directly

```bash
DSH_DESKTOP_PATCH=/your/cordis.yml /opt/DeepSeek\ Harness\ Desktop/deepseek-harness-desktop
```

### How it works

The internal command is normally:

```sh
dsh web --host 127.0.0.1 --port <random-free-port>
```

With `DSH_DESKTOP_PATCH=/a/b.yml` it becomes:

```sh
dsh web --patch /a/b.yml --host 127.0.0.1 --port <random-free-port>
```

The port is still auto-assigned by the shell and cannot be overridden through this mechanism.

## About the shell & building

- `main/main.js` and `main/runtime-manager.js` here are **source**, not build artifacts. The enhancements live in `launchForPort()` (`DSH_DESKTOP_PATCH` / `DSH_DESKTOP_EXTRA_ARGS`) and in `resolveRuntime()` (managed-runtime-first resolution: `DSH_BIN` → managed cache/download → machine-installed dsh as fallback).
- Auto-update (electron-updater) is configured against **this** repository, so updates come from here and keep the enhancement. The upstream original does **not** contain these patches.

## Screenshots

| macOS | Linux |
| --- | --- |
| <img src="assets/screenshots/macos.jpg" alt="DeepSeek Harness Desktop on macOS" width="100%"> | <img src="assets/screenshots/linux.png" alt="DeepSeek Harness Desktop on Linux" width="100%"> |
