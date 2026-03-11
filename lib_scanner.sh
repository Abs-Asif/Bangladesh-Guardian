#!/bin/bash
host="https://backoffice.bangladeshguardian.com"
libs=(
  "/laravel-filemanager"
  "/vendor/laravel-filemanager"
  "/filemanager"
  "/elfinder"
  "/ckeditor"
  "/tinymce"
  "/summernote"
  "/kcfinder"
  "/file-manager"
  "/admin/file-manager"
  "/pma"
  "/phpmyadmin"
)

for l in "${libs[@]}"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" -I "$host$l")
  if [ "$code" != "404" ]; then
    echo "Found lib path: $l (Code: $code)"
  fi
done
