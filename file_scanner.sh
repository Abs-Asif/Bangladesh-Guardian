#!/bin/bash
host="https://backoffice.bangladeshguardian.com"
files=(
  "upload.php"
  "up.php"
  "save.php"
  "img_upload.php"
  "image_upload.php"
  "media_upload.php"
  "file_upload.php"
  "uploader.php"
  "api/upload.php"
  "api/save.php"
  "api-en/upload.php"
  "api-en/save.php"
  "backend/upload.php"
  "backend/save.php"
  "public/upload.php"
)

for f in "${files[@]}"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" -I "$host/$f")
  if [ "$code" != "404" ]; then
    echo "Found file: $f (Code: $code)"
  fi
done
