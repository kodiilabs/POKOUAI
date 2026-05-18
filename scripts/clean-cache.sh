#!/bin/bash
# clean-cache.sh
#
# Reclaim disk space by wiping developer-tool caches that can be regenerated
# on demand. Targeted at the typical RN/Expo + iOS + ML workstation.
#
# Each section is independent — failures in one don't block the others.
# All targets are caches (rebuildable), not source or project state.
#
# Usage:
#   bash scripts/clean-cache.sh

set -u  # error on unset vars; intentionally NOT set -e (rm -rf on missing paths is fine)

step() { echo ""; echo "── $1"; }
size_of() { [ -e "$1" ] && du -sh "$1" 2>/dev/null | awk '{print $1}' || echo "n/a"; }

echo "==> Disk before:"
df -h /

# ── 1. Bazel cache (LiteRT-LM build attempt left ~10 GB+) ────────────────
step "Bazel cache  (was: $(size_of /private/var/tmp/_bazel_yaokouadio))"
rm -rf /private/var/tmp/_bazel_yaokouadio
echo "   ✓ wiped"

# ── 2. LiteRT-LM in-tree build dir ───────────────────────────────────────
LITERT_BUILD="/Users/yaokouadio/Projects/STARTUP/pokou-ai/app/node_modules/react-native-litert-lm/.litert-lm-build"
step "LiteRT-LM build dir  (was: $(size_of "$LITERT_BUILD"))"
rm -rf "$LITERT_BUILD"
echo "   ✓ wiped"

# ── 3. Xcode DerivedData (usually the biggest single reclaim) ────────────
step "Xcode DerivedData  (was: $(size_of ~/Library/Developer/Xcode/DerivedData))"
rm -rf ~/Library/Developer/Xcode/DerivedData
echo "   ✓ wiped — Xcode will rebuild on next launch"

# ── 4. CocoaPods caches ──────────────────────────────────────────────────
step "CocoaPods Pods cache  (was: $(size_of ~/Library/Caches/CocoaPods/Pods))"
rm -rf ~/Library/Caches/CocoaPods/Pods
echo "   ✓ wiped"

step "CocoaPods repos  (was: $(size_of ~/.cocoapods/repos))"
rm -rf ~/.cocoapods/repos
echo "   ✓ wiped — first 'pod install' will re-clone the trunk specs"

# ── 5. pnpm store ────────────────────────────────────────────────────────
step "pnpm store  (was: $(pnpm store path 2>/dev/null | xargs -I{} du -sh {} 2>/dev/null | awk '{print $1}' || echo n/a))"
if command -v pnpm >/dev/null 2>&1; then
  pnpm store prune || true
  echo "   ✓ pruned"
else
  echo "   pnpm not installed, skipping"
fi

# ── 6. npm cache ─────────────────────────────────────────────────────────
step "npm cache  (was: $(size_of ~/.npm))"
if command -v npm >/dev/null 2>&1; then
  npm cache clean --force >/dev/null 2>&1 || true
  echo "   ✓ cleaned"
else
  echo "   npm not installed, skipping"
fi

# ── 7. Expo cache ────────────────────────────────────────────────────────
step "Expo cache  (was: $(size_of ~/.expo))"
rm -rf ~/.expo
echo "   ✓ wiped"

# ── 8. Watchman state ────────────────────────────────────────────────────
step "Watchman watches"
if command -v watchman >/dev/null 2>&1; then
  watchman watch-del-all >/dev/null 2>&1 || true
  echo "   ✓ watches deleted"
else
  echo "   watchman not installed, skipping"
fi

# ── 9. Metro bundler cache ───────────────────────────────────────────────
step "Metro / haste-map temp caches"
rm -rf "${TMPDIR:-/tmp}/metro-"*  "${TMPDIR:-/tmp}/haste-map-"* 2>/dev/null || true
echo "   ✓ wiped"

# ── 10. Gradle cache (Android — only if you've ever built for Android) ──
step "Gradle caches  (was: $(size_of ~/.gradle/caches))"
rm -rf ~/.gradle/caches ~/.gradle/daemon 2>/dev/null
echo "   ✓ wiped"

echo ""
echo "==> Disk after:"
df -h /
echo ""
echo "Done. Next:"
echo "  • If you'll rebuild iOS, expect first 'pod install' to take longer (re-cloning trunk)."
echo "  • If you rely on Watchman, restart Metro to re-establish watches."
