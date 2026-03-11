#!/bin/bash
host="https://backoffice.bangladeshguardian.com"
prefixes=("/api-en" "/api" "")
names=("upload" "upload-image" "image-upload" "upload-file" "file-upload" "media-upload" "upload-media" "save-image" "store-image" "upload_image" "image_upload" "upload_file" "file_upload")
extensions=("" ".php" ".json")

for pre in "${prefixes[@]}"; do
  for name in "${names[@]}"; do
    for ext in "${extensions[@]}"; do
      path="$pre/$name$ext"
      # echo "Testing POST $path"
      code=$(curl -s -o /dev/null -w "%{http_code}" -X POST -F "file=@test.txt" "$host$path")
      if [ "$code" != "404" ] && [ "$code" != "000" ]; then
        echo "FOUND: $path (Code: $code)"
        curl -s -X POST -F "file=@test.txt" "$host$path" | head -c 200
        echo ""
      fi
    done
  done
done
