#!/bin/bash
host="https://backoffice.bangladeshguardian.com/api-en"
words=("upload" "save" "store" "image" "media" "file" "post" "create" "add" "insert" "content" "news" "photo" "img")
for w1 in "${words[@]}"; do
  for w2 in "${words[@]}"; do
    for sep in "" "-" "_"; do
      path="$w1$sep$w2"
      # echo "Testing $path"
      code=$(curl -s -o /dev/null -w "%{http_code}" -X POST -F "file=@test.txt" "$host/$path")
      if [ "$code" != "404" ] && [ "$code" != "000" ]; then
        echo "FOUND: $host/$path (Code: $code)"
      fi
    done
  done
done
