#!/bin/bash

OUTPUT_FILE="codebase.txt"

EXCLUDE_DIRS=(".git" ".next" ".vercel" ".turbo" "node_modules" ".vscode" ".idea" "dist" "build" "coverage" "temp" "tmp" "marketing" "api" "eslint-config" "ui" "typescript-config")
EXCLUDE_FILES=("*.log" "*.tmp" "*.cache" "pnpm-lock.yaml" "package-lock.json" "yarn.lock" "tsconfig.tsbuildinfo" ".DS_Store" "Thumbs.db" "$OUTPUT_FILE")
INCLUDE_EXTENSIONS=("*.ts" "*.tsx" "*.js" "*.jsx" "*.json" "*.md" "*.yml" "*.yaml" "*.env" "*.env.example" "*.sql" "*.prisma" "*.txt" "*.config.*")

echo "🚀 Сбор кодовой базы проекта..."
> "$OUTPUT_FILE"

echo "=== КОДОВАЯ БАЗА ПРОЕКТА ===" >> "$OUTPUT_FILE"
echo "Сгенерировано: $(date)" >> "$OUTPUT_FILE"
echo "Директория: $(pwd)" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

should_exclude_dir() {
    local dir_name="$1"
    for exclude in "${EXCLUDE_DIRS[@]}"; do
        [[ "$dir_name" == $exclude ]] && return 0
    done
    return 1
}

should_exclude_file() {
    local file_name="$1"
    for exclude in "${EXCLUDE_FILES[@]}"; do
        [[ "$file_name" == $exclude ]] && return 0
    done
    return 1
}

should_include_file() {
    local file_name="$1"
    for ext in "${INCLUDE_EXTENSIONS[@]}"; do
        [[ "$file_name" == $ext ]] && return 0
    done
    return 1
}

process_file() {
    local file_path="$1"
    echo "=== ${file_path#./} ===" >> "$OUTPUT_FILE"
    cat "$file_path" >> "$OUTPUT_FILE" 2>/dev/null || echo "[ОШИБКА ЧТЕНИЯ ФАЙЛА]" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
}

traverse_directory() {
    local current_dir="$1"

    for item in "$current_dir"/*; do
        [[ ! -e "$item" ]] && continue

        local item_name=$(basename "$item")

        if [[ -f "$item" ]]; then
            should_exclude_file "$item_name" && continue
            should_include_file "$item_name" && { echo "📄 $item"; process_file "$item"; }
        elif [[ -d "$item" ]]; then
            should_exclude_dir "$item_name" && { echo "⏭️  Пропускаем: $item"; continue; }
            echo "📁 $item"
            traverse_directory "$item"
        fi
    done
}

traverse_directory "."

echo "✅ Готово! Размер: $(du -h "$OUTPUT_FILE" | cut -f1), строк: $(wc -l < "$OUTPUT_FILE")"
