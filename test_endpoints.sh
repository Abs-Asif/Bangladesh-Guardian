#!/bin/bash
endpoints=(
  "/api/upload"
  "/api-en/upload"
  "/api-en/image-upload"
  "/api-en/media-upload"
  "/api-en/file-upload"
  "/api-en/save-image"
  "/api-en/store-image"
  "/api-en/image"
  "/api-en/media"
  "/api-en/upload/image"
  "/api/v1/upload"
  "/api/v2/upload"
  "/api/media/upload"
  "/api/image/upload"
  "/media/upload"
  "/image/upload"
  "/upload"
  "/public/upload"
  "/storage/upload"
  "/api-en/archive/upload"
  "/api-en/photocard/upload"
  "/api-en/upload-photocard"
)

for ep in "${endpoints[@]}"; do
  echo -n "Testing POST $ep: "
  code=$(curl -s -o /dev/null -w "%{http_code}" -X POST -F "file=@package.json" "https://backoffice.bangladeshguardian.com$ep")
  echo "$code"
  if [ "$code" != "404" ] && [ "$code" != "405" ]; then
    echo "Potential match: $ep (Code: $code)"
    curl -s -X POST -F "file=@package.json" "https://backoffice.bangladeshguardian.com$ep" | head -c 200
    echo ""
  fi
done
