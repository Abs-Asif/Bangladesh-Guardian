#!/bin/bash
host="https://backoffice.bangladeshguardian.com"
while read p; do
  # echo "Testing $p..."
  code=$(curl -s -o /dev/null -w "%{http_code}" -X POST -F "file=@test.txt" "$host/$p")
  if [ "$code" != "404" ] && [ "$code" != "405" ] && [ "$code" != "000" ]; then
    echo "MATCH: /$p -> $code"
  fi
done < endpoints.txt
