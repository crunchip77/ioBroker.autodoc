#!/usr/bin/env bash
# Install Chromium runtime libraries for @mermaid-js/mermaid-cli (Puppeteer) on Linux hosts.
# AutoDoc uses mmdc during documentation generation to embed Mermaid diagrams as SVG.
#
# When to run: ioBroker log shows mmdc failed / libnss3.so missing / Failed to launch browser.
#
# Native Debian/Ubuntu (as root):
#   curl -fsSL https://raw.githubusercontent.com/crunchip77/ioBroker.autodoc/dev/scripts/install-chromium-deps-linux.sh | bash
# Or from a cloned repo:
#   sudo bash scripts/install-chromium-deps-linux.sh
#
# buanet ioBroker Docker (Unraid etc.): add to container env and recreate once:
#   PACKAGES="libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libgbm1 libasound2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libpango-1.0-0 libcairo2 libx11-6 libx11-xcb1 libxcb1 libxext6 libxi6"
#
# After install: restart autodoc instance and regenerate documentation.

set -euo pipefail

if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
	echo "Please run as root (sudo bash $0)." >&2
	exit 1
fi

if command -v apt-get >/dev/null 2>&1; then
	export DEBIAN_FRONTEND=noninteractive
	apt-get update -qq
	apt-get install -y --no-install-recommends \
		libnss3 \
		libatk1.0-0 \
		libatk-bridge2.0-0 \
		libcups2 \
		libdrm2 \
		libgbm1 \
		libasound2 \
		libxkbcommon0 \
		libxcomposite1 \
		libxdamage1 \
		libxfixes3 \
		libxrandr2 \
		libpango-1.0-0 \
		libcairo2 \
		libx11-6 \
		libx11-xcb1 \
		libxcb1 \
		libxext6 \
		libxi6 \
		ca-certificates \
		fonts-liberation
	echo "Done. Restart autodoc.0 and regenerate documentation."
	exit 0
fi

if command -v apk >/dev/null 2>&1; then
	apk add --no-cache \
		nss \
		atk-atk-bridge \
		cups-libs \
		libdrm \
		mesa-gbm \
		alsa-lib \
		libxkbcommon \
		libxcomposite \
		libxdamage \
		libxfixes \
		libxrandr \
		pango \
		cairo \
		libx11 \
		libxext \
		libxi \
		ca-certificates \
		fontconfig
	echo "Done. Restart autodoc.0 and regenerate documentation."
	exit 0
fi

echo "Unsupported package manager. Install Puppeteer Linux deps manually: https://pptr.dev/troubleshooting" >&2
exit 1
