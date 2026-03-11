#!/bin/bash
host="https://backoffice.bangladeshguardian.com/api-en"
while read name; do
  code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "https://backoffice.bangladeshguardian.com/api-en/$name")
  if [ "$code" != "404" ] && [ "$code" != "405" ]; then
    echo "MATCH: $name -> $code"
  fi
done < api_names.txt
