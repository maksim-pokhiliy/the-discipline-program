#!/usr/bin/env bash
set -euo pipefail

OUTPUT_FILE="the-discipline-program-codebase-dump.txt"

EXCLUDE_DIRS=(.git .next .vercel .turbo node_modules .vscode .idea dist build coverage temp tmp public)
EXCLUDE_FILES=("*.log" "*.tmp" "*.cache" "pnpm-lock.yaml" "package-lock.json" "yarn.lock" "tsconfig.tsbuildinfo" ".DS_Store" "Thumbs.db" "$OUTPUT_FILE" "*.svg" "next-env.d.ts")
INCLUDE_REGEX='\.((c|m)?js|tsx?|json|md|ya?ml|env(\.example)?|sql|prisma|txt)$'
MAX_BYTES=$((512 * 1024))

echo "🚀 Сбор кодовой базы проекта..."
: > "$OUTPUT_FILE"

write() { printf "%s\n" "$*" >> "$OUTPUT_FILE"; }

# --- Header ---
write "=== CODEBASE DUMP ==="
write "Generated: $(date -Iseconds)"
write "Dir: $(pwd)"
write ""

# --- Project tree (structure is reality) ---
write "=== PROJECT TREE (filtered) ==="
if command -v tree >/dev/null 2>&1; then
  tree -a -I "$(IFS="|"; echo "${EXCLUDE_DIRS[*]}")" \
    --dirsfirst >> "$OUTPUT_FILE" 2>/dev/null || write "[tree failed]"
else
  write "[tree not installed]"
fi
write ""

# --- Build a deterministic file list using find ---
write "=== FILE INDEX (filtered, deterministic) ==="

# Build prune expression
PRUNE_EXPR=()
for d in "${EXCLUDE_DIRS[@]}"; do
  PRUNE_EXPR+=( -name "$d" -o )
done
# remove last -o
unset 'PRUNE_EXPR[${#PRUNE_EXPR[@]}-1]'

# Find files
# Note: LC_ALL=C sort for deterministic ordering
mapfile -t FILES < <(
  find . \
    \( -type d \( "${PRUNE_EXPR[@]}" \) -prune \) -o \
    \( -type f -print \) \
  | LC_ALL=C sort
)

# Filter include + exclude patterns
FILTERED=()
for f in "${FILES[@]}"; do
  base="$(basename "$f")"

  # exclude file globs
  excluded=0
  for pat in "${EXCLUDE_FILES[@]}"; do
    if [[ "$base" == $pat ]]; then
      excluded=1; break
    fi
  done
  [[ "$excluded" == 1 ]] && continue

  # include by regex
  if [[ "$f" =~ $INCLUDE_REGEX ]]; then
    FILTERED+=( "$f" )
  fi
done

# Write index with sizes
for f in "${FILTERED[@]}"; do
  # size in bytes
  sz="$(wc -c < "$f" 2>/dev/null || echo 0)"
  printf "%10s  %s\n" "$sz" "${f#./}" >> "$OUTPUT_FILE"
done
write ""

# --- File contents ---
write "=== FILE CONTENTS ==="
write "Format:"
write "----- BEGIN FILE: path (bytes=N) -----"
write "...content..."
write "----- END FILE: path -----"
write ""

for f in "${FILTERED[@]}"; do
  rel="${f#./}"
  bytes="$(wc -c < "$f" 2>/dev/null || echo 0)"

  write "----- BEGIN FILE: $rel (bytes=$bytes) -----"

  # Skip binaries (very basic heuristic)
  if command -v file >/dev/null 2>&1; then
    if file -b --mime "$f" | grep -q 'charset=binary'; then
      write "[SKIPPED BINARY FILE]"
      write "----- END FILE: $rel -----"
      write ""
      continue
    fi
  fi

  if (( bytes > MAX_BYTES )); then
    write "[TRUNCATED: file is larger than ${MAX_BYTES} bytes]"
    # show head + tail to preserve useful context
    write "--- HEAD (first 200 lines) ---"
    sed -n '1,200p' "$f" >> "$OUTPUT_FILE" 2>/dev/null || write "[READ ERROR]"
    write "--- TAIL (last 200 lines) ---"
    tail -n 200 "$f" >> "$OUTPUT_FILE" 2>/dev/null || true
  else
    cat "$f" >> "$OUTPUT_FILE" 2>/dev/null || write "[READ ERROR]"
  fi

  write "----- END FILE: $rel -----"
  write ""
done

echo "✅ Готово! Размер: $(du -h "$OUTPUT_FILE" | cut -f1), строк: $(wc -l < "$OUTPUT_FILE")"
