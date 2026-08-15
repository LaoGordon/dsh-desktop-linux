#!/bin/sh
# DeepSeek Harness Desktop — 一键安装脚本（deb）
#
# 从 GitHub Releases 下载最新的 .deb 安装包并安装。
# 需要 sudo（通过 apt 安装系统包）。
#
# 用法:
#   ./install.sh            安装最新版本
#   ./install.sh <deb 文件> 安装本地 deb（跳过下载）
#   ./install.sh --print-url 只打印将下载的 deb 地址（不下载）
#   DSH_DESKTOP_VERSION=v1.0.2 ./install.sh  安装指定版本

set -eu

REPOSITORY="LaoGordon/dsh-desktop-linux"

die() {
  printf 'error: %s\n' "$*" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || die "required command not found: $1 (need curl)"
}

install_deb() {
  deb="$1"
  printf 'Installing %s ...\n' "$deb"
  sudo apt install -y "$deb"
}

resolve_tag() {
  version="${DSH_DESKTOP_VERSION:-latest}"
  case "$version" in
    latest)
      # releases/latest 会 302 到具体 tag，取重定向 URL 中的版本号
      url="$(curl -sIL -o /dev/null -w '%{url_effective}' \
        "https://github.com/$REPOSITORY/releases/latest")"
      tag="$(printf '%s' "$url" | sed 's:.*/tag/::')"
      ;;
    *)
      case "$version" in
        v*) tag="$version" ;;
        *) tag="v$version" ;;
      esac
      case "$tag" in
        *[!A-Za-z0-9._-]*)
          printf 'error: invalid version: %s\n' "$version" >&2
          return 1
          ;;
      esac
      ;;
  esac
  if [ -z "${tag:-}" ]; then
    printf 'error: could not determine the latest version\n' >&2
    return 1
  fi
  printf '%s' "$tag"
}

deb_url() {
  printf 'https://github.com/%s/releases/download/%s/DeepSeek-Harness-Desktop-%s-linux-amd64.deb' \
    "$REPOSITORY" "$1" "${1#v}"
}

main() {
  if [ "${1:-}" = "--print-url" ]; then
    require_command curl
    tag="$(resolve_tag)" || exit 1
    deb_url "$tag"
    printf '\n'
    exit 0
  fi
  if [ "$#" -gt 0 ]; then
    install_deb "$1"
    exit 0
  fi
  require_command curl

  tag="$(resolve_tag)" || exit 1
  url="$(deb_url "$tag")"

  tmp="$(mktemp)"
  trap 'rm -f "$tmp"' EXIT HUP INT TERM
  printf 'Downloading %s ...\n' "$url"
  curl -fSL --retry 3 -o "$tmp" "$url"
  printf 'SHA-256: %s\n' "$(sha256sum "$tmp" | awk '{print $1}')"
  install_deb "$tmp"
}

main "$@"
