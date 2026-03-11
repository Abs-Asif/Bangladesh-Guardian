#!/bin/bash
host="https://backoffice.bangladeshguardian.com"
prefixes=("" "/api" "/api-en" "/api/v1" "/api/v2" "/media" "/storage" "/public" "/admin")
names=("upload" "upload-image" "image-upload" "upload-file" "file-upload" "save" "store" "media-upload" "upload-media" "img-upload" "upload-img")
extensions=("" ".php" ".php5" ".php7" ".phtml" ".ashx" ".aspx" ".asp" ".jsp" ".do")

for pre in "${prefixes[@]}"; do
  for name in "${names[@]}"; do
    for ext in "${extensions[@]}"; do
      path="$pre/$name$ext"
      # echo "Testing $path"
      code=$(curl -s -o /dev/null -w "%{http_code}" -X POST -F "file=@test.txt" "$host$path")
      if [ "$code" != "404" ] && [ "$code" != "000" ] && [ "$code" != "405" ]; then
        echo "FOUND: $path (Code: $code)"
        # curl -s -X POST -F "file=@test.txt" "$host$path" | head -c 200
        # echo ""
      fi
    done
  done
done
