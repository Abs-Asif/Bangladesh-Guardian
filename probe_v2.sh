#!/bin/bash
host="https://backoffice.bangladeshguardian.com/api-en"
while read p; do
  code=$(curl -s -o /dev/null -w "%{http_code}" -X POST -F "file=@test.txt" "$host/$p")
  if [ "$code" != "404" ] && [ "$code" != "000" ]; then
    echo "MATCH: $host/$p -> $code"
    curl -s -X POST -F "file=@test.txt" "$host/$p" | head -c 200
    echo ""
  fi
done < wordlist.txt
