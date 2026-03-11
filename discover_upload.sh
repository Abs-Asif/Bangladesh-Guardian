#!/bin/bash
host="https://backoffice.bangladeshguardian.com"
endpoints=(
  "/api-en/upload"
  "/api-en/image-upload"
  "/api-en/media-upload"
  "/api-en/upload-image"
  "/api-en/save-image"
  "/api-en/image"
  "/api-en/media"
  "/api/upload"
  "/api/image-upload"
  "/upload"
  "/media/upload"
  "/storage/upload"
)
fields=("file" "image" "img" "photo" "Filedata" "files[]" "image[]")

for ep in "${endpoints[@]}"; do
  for f in "${fields[@]}"; do
    # echo "Testing POST $ep with field $f"
    code=$(curl -s -o /dev/null -w "%{http_code}" -X POST -F "$f=@test.txt" "$host$ep")
    if [ "$code" != "404" ] && [ "$code" != "405" ] && [ "$code" != "000" ] && [ "$code" != "301" ] && [ "$code" != "403" ]; then
      echo "MATCH: POST $ep ($f=...) -> $code"
      curl -s -X POST -F "$f=@test.txt" "$host$ep" | head -c 200
      echo ""
    fi
  done
done
