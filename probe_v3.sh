#!/bin/bash
host="https://backoffice.bangladeshguardian.com/api-en"
words=("archive" "news" "article" "post" "content" "category" "tag" "writer" "author" "image" "media" "file" "photo" "img" "gallery" "slider" "breaking" "trending" "popular" "featured" "video" "audio" "upload" "save" "store" "create" "add" "insert" "update" "edit" "show" "list" "detail" "search" "filter" "settings" "profile" "login" "logout" "register")

for w in "${words[@]}"; do
  # Try simple word
  code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$host/$w")
  if [ "$code" != "404" ] && [ "$code" != "405" ]; then
    echo "MATCH: POST /api-en/$w -> $code"
  fi
done

# Try common combinations
combos=("upload-image" "image-upload" "save-image" "store-image" "upload-file" "file-upload" "media-upload" "upload-media" "save-news" "create-news" "add-news")
for c in "${combos[@]}"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$host/$c")
  if [ "$code" != "404" ] && [ "$code" != "405" ]; then
    echo "MATCH: POST /api-en/$c -> $code"
  fi
done
