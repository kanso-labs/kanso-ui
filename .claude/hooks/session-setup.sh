#!/bin/bash
# SessionStart hook. Checks the three things a session needs before a test, a
# lint or the dev server runs, and puts right what it can:
#
# - The Node that .tool-versions pins, put first on PATH for the session
#   through $CLAUDE_ENV_FILE. It is mise's copy where mise is installed, and
#   otherwise the release from nodejs.org, checked against the SHA-256 the
#   release publishes and cached under ~/.cache/kanso-ui. An older npm drops
#   the lockfile's Linux platform entries on its next install, with no symptom
#   until a Linux runner installs the wrong native binary.
# - node_modules, installed when it is missing with `npm ci --ignore-scripts`
#   and then husky. `prepare` would also run `playwright install --with-deps`,
#   which needs root for its system packages, and the browser is checked
#   separately below.
# - The Chromium revision the installed Playwright drives, installed with
#   `playwright install chromium` when it is missing. An older revision is never
#   linked in its place: the tests read computed styles, and an older Chromium
#   changes which CSS features exist.
#
# What it cannot put right it reports on stdout, which Claude Code adds to the
# session's context, together with what to do about it. It exits 0 either way,
# so a download that fails never stops a session from starting.
set -uo pipefail

cd "$CLAUDE_PROJECT_DIR" || exit 0

report=()

note() {
  report+=("$1")
}

# Compares an archive's hash with the line the release's SHASUMS256.txt gives
# it. The hash is compared as a string rather than through `-c`, whose flags
# differ between GNU's sha256sum and the BSD one macOS ships.
verify_sha256() {
  local dir=$1 file=$2
  local expected actual
  expected=$(awk -v file="$file" '$2 == file { print $1 }' "$dir/SHASUMS256.txt")
  if command -v sha256sum >/dev/null 2>&1; then
    actual=$(sha256sum "$dir/$file" | awk '{ print $1 }')
  else
    actual=$(shasum -a 256 "$dir/$file" | awk '{ print $1 }')
  fi
  [ -n "$expected" ] && [ "$expected" = "$actual" ]
}

# Prints the bin directory of Node $1, fetching it first if need be.
node_bin() {
  local version=$1
  local dir

  if command -v mise >/dev/null 2>&1; then
    dir=$(mise where "node@$version" 2>/dev/null) ||
      { mise install "node@$version" >&2 && dir=$(mise where "node@$version"); }
    if [ -x "${dir:-}/bin/node" ]; then
      echo "$dir/bin"
      return 0
    fi
  fi

  local os arch
  case "$(uname -s)" in
    Darwin) os=darwin ;;
    Linux) os=linux ;;
    *) return 1 ;;
  esac
  case "$(uname -m)" in
    aarch64 | arm64) arch=arm64 ;;
    amd64 | x86_64) arch=x64 ;;
    *) return 1 ;;
  esac

  local name="node-v$version-$os-$arch"
  dir="${XDG_CACHE_HOME:-$HOME/.cache}/kanso-ui/$name"
  if [ ! -x "$dir/bin/node" ]; then
    local release="https://nodejs.org/dist/v$version"
    local download
    download=$(mktemp -d)
    if ! curl -fsSL "$release/$name.tar.gz" -o "$download/$name.tar.gz" ||
      ! curl -fsSL "$release/SHASUMS256.txt" -o "$download/SHASUMS256.txt" ||
      ! verify_sha256 "$download" "$name.tar.gz"; then
      rm -rf "$download"
      return 1
    fi
    mkdir -p "$dir" &&
      tar -xzf "$download/$name.tar.gz" -C "$dir" --strip-components=1
    rm -rf "$download"
  fi
  [ -x "$dir/bin/node" ] && echo "$dir/bin"
}

want=$(awk '$1 == "nodejs" { print $2 }' .tool-versions)
have=$(node --version 2>/dev/null || echo none)

if [ "$have" != "v$want" ]; then
  if bin=$(node_bin "$want") && [ "$("$bin/node" --version)" = "v$want" ]; then
    export PATH="$bin:$PATH"
    line="export PATH=\"$bin:\$PATH\""
    if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
      grep -qxF "$line" "$CLAUDE_ENV_FILE" 2>/dev/null ||
        printf '%s\n' "$line" >>"$CLAUDE_ENV_FILE"
      note "Node $want is first on PATH for this session, from $bin; the shell had $have."
    else
      note "The shell has Node $have, not the $want that .tool-versions pins. No CLAUDE_ENV_FILE to put it on PATH with, so run \`$line\` before npm."
    fi
  else
    note "The shell has Node $have, not the $want that .tool-versions pins, and that release could not be downloaded from nodejs.org and checked against its SHASUMS256.txt. Install it before running npm install: an older npm drops the lockfile's Linux platform entries."
  fi
fi

if [ ! -d node_modules ]; then
  if npm ci --ignore-scripts >&2 && npx --no-install husky >&2; then
    note "Installed node_modules with npm ci --ignore-scripts, and husky's hooks."
  else
    note "npm ci --ignore-scripts failed, so nothing is installed; run it by hand to see why. The Chromium check was skipped, since it reads Playwright from node_modules."
  fi
fi

if [ -d node_modules ]; then
  plan=$(npx --no-install playwright install --dry-run chromium 2>/dev/null)
  missing=()
  while read -r location; do
    case "${location##*/}" in
      chromium*) [ -f "$location/INSTALLATION_COMPLETE" ] || missing+=("$location") ;;
    esac
  done < <(awk '/Install location:/ { print $NF }' <<<"$plan")

  if [ ${#missing[@]} -gt 0 ]; then
    if output=$(npx --no-install playwright install chromium 2>&1); then
      note "Installed Playwright's Chromium into ${missing[*]}."
    else
      # Playwright retries each download and prints a stack per attempt; the
      # first error line is the cause, a refused connection or a path it
      # cannot write to.
      reason=$(grep -m 1 -E '^Error: ' <<<"$output" | sed 's/^Error: //')
      hosts=$(grep -oE 'https://[^/]+' <<<"$plan" | sort -u | sed 's#https://##' | paste -sd ' ' -)
      note "Playwright's Chromium is missing from ${missing[*]}, and playwright install chromium failed (${reason:-no error printed}). If the network is the cause, allow ${hosts:-its download hosts} and start the session again. Do not link an older revision in its place: the tests read computed styles, and an older Chromium changes which CSS features exist."
    fi
  fi
fi

if [ ${#report[@]} -eq 0 ]; then
  echo "Session check: Node $want, node_modules and Playwright's Chromium are in place."
else
  echo "Session check:"
  printf -- '- %s\n' "${report[@]}"
fi
exit 0
