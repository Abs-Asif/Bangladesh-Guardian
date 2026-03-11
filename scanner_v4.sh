#!/bin/bash
host="https://backoffice.bangladeshguardian.com/api-en"
# Try to find valid GET/POST endpoints first
words=("archive" "categories" "category" "tags" "tag" "writers" "writer" "news" "articles" "article" "latest" "trending" "popular" "featured" "search" "detail" "details" "config" "settings" "about" "contact" "home" "index")

for w in "${words[@]}"; do
  code_get=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$host/$w")
  code_post=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$host/$w")
  if [ "$code_get" != "404" ] || [ "$code_post" != "404" ]; then
    echo "Endpoint: $w | GET: $code_get | POST: $code_post"
  fi
done

# Try variants
variants=("all-news" "news-archive" "news-detail" "get-categories" "get-writers")
for v in "${variants[@]}"; do
  code_post=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$host/$v")
  if [ "$code_post" != "404" ]; then
    echo "Variant: $v | POST: $code_post"
  fi
done
