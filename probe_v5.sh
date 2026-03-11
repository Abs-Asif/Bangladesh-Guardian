#!/bin/bash
host="https://backoffice.bangladeshguardian.com/api-en"
words=("upload" "image" "img" "media" "photo" "photocard" "file" "save" "store" "add" "create" "insert" "post" "news" "content" "archive" "gallery" "attachment")

for w in "${words[@]}"; do
  # Try plain word
  code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$host/$w")
  if [ "$code" != "404" ] && [ "$code" != "405" ]; then echo "MATCH: POST /api-en/$w -> $code"; fi

  # Try upload-word and word-upload
  code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$host/upload-$w")
  if [ "$code" != "404" ] && [ "$code" != "405" ]; then echo "MATCH: POST /api-en/upload-$w -> $code"; fi

  code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$host/$w-upload")
  if [ "$code" != "404" ] && [ "$code" != "405" ]; then echo "MATCH: POST /api-en/$w-upload -> $code"; fi
done
