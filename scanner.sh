#!/bin/bash
host="https://backoffice.bangladeshguardian.com"
verbs=("upload" "save" "store" "add" "create" "insert")
nouns=("image" "photo" "img" "media" "file" "photocard" "content")
formats=("" ".php" ".json")
prefixes=("/api-en" "/api" "")

for pre in "${prefixes[@]}"; do
  for v in "${verbs[@]}"; do
    for n in "${nouns[@]}"; do
      for ext in "${formats[@]}"; do
        for sep in "" "-" "_"; do
          # Try verb-noun
          path="$pre/$v$sep$n$ext"
          code=$(curl -s -o /dev/null -w "%{http_code}" -X POST -F "image=@test.txt" "$host$path")
          if [ "$code" != "404" ] && [ "$code" != "405" ] && [ "$code" != "000" ] && [ "$code" != "301" ]; then
            echo "MATCH: POST $path (image=...) -> $code"
          fi

          # Try noun-verb
          path="$pre/$n$sep$v$ext"
          code=$(curl -s -o /dev/null -w "%{http_code}" -X POST -F "image=@test.txt" "$host$path")
          if [ "$code" != "404" ] && [ "$code" != "405" ] && [ "$code" != "000" ] && [ "$code" != "301" ]; then
            echo "MATCH: POST $path (image=...) -> $code"
          fi
        done
      done
    done
  done
done
