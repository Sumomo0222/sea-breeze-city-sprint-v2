#!/bin/sh
# 把 src/ 下的分块源码拼成单文件 index.html。只依赖 sh 和 cat，不需要 Node。
# 用法：在此目录执行  sh build.sh
set -e
cd "$(dirname "$0")"
{
  cat src/00-head.html
  cat src/font.css
  cat src/style.css src/10-body.html
  cat src/js/*.js
  printf '\n</script>\n</body>\n</html>\n'
} > index.html
echo "built index.html ($(wc -c < index.html | tr -d ' ') bytes)"
