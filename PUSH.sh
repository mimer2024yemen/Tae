#!/bin/bash
# 🔥 سكربت رفع سريع - عاجل نيوز
# استخدمه: bash PUSH.sh YOUR_GITHUB_TOKEN

TOKEN=${1:-"github…XJkF"}
cd "$(dirname "$0")"

echo "🚀 رفع عاجل نيوز إلى GitHub..."
echo ""

FILES=(
    server.js database.js news-fetcher.js package.json
    admin/index.html admin/admin.css admin/admin.js
    public/index.html public/style.css public/script.js public/section.html public/news-live.js
    .github/workflows/fetch-news.yml .github/scripts/fetch-news.js
)

for f in "${FILES[@]}"; do
    [ ! -f "$f" ] && echo "⚠️ $f not found" && continue
    content=$(base64 -w0 "$f")
    sha=$(curl -s -H "Authorization: token $TOKEN" "https://api.github.com/repos/mimer2024yemen/Tae/contents/$f" | python3 -c "import sys,json; print(json.load(sys.stdin).get('sha',''))" 2>/dev/null)
    
    if [ -n "$sha" ]; then
        res=$(curl -s -X PUT -H "Authorization: token $TOKEN" -H "Content-Type: application/json" "https://api.github.com/repos/mimer2024yemen/Tae/contents/$f" -d "{\"message\":\"update news system\",\"content\":\"$content\",\"sha\":\"$sha\",\"branch\":\"main\"}")
    else
        res=$(curl -s -X PUT -H "Authorization: token $TOKEN" -H "Content-Type: application/json" "https://api.github.com/repos/mimer2024yemen/Tae/contents/$f" -d "{\"message\":\"add news system\",\"content\":\"$content\",\"branch\":\"main\"}")
    fi
    ok=$(echo "$res" | python3 -c "import sys,json; print('✅' if json.load(sys.stdin).get('content') else '❌')" 2>/dev/null)
    echo "$ok $f"
    sleep 0.3
done

echo ""
echo "📰 رفع بيانات الأخبار..."
DATA_FILES=(public/data/news.json public/data/latest.json public/data/news-international.json public/data/news-sports.json public/data/news-economy.json public/data/news-entertainment.json public/data/news-tourism.json)

for f in "${DATA_FILES[@]}"; do
    [ ! -f "$f" ] && continue
    content=$(base64 -w0 "$f")
    sha=$(curl -s -H "Authorization: token $TOKEN" "https://api.github.com/repos/mimer2024yemen/Tae/contents/$f" | python3 -c "import sys,json; print(json.load(sys.stdin).get('sha',''))" 2>/dev/null)
    
    if [ -n "$sha" ]; then
        res=$(curl -s -X PUT -H "Authorization: token $TOKEN" -H "Content-Type: application/json" "https://api.github.com/repos/mimer2024yemen/Tae/contents/$f" -d "{\"message\":\"update news data\",\"content\":\"$content\",\"sha\":\"$sha\",\"branch\":\"main\"}")
    else
        res=$(curl -s -X PUT -H "Authorization: token $TOKEN" -H "Content-Type: application/json" "https://api.github.com/repos/mimer2024yemen/Tae/contents/$f" -d "{\"message\":\"add news data\",\"content\":\"$content\",\"branch\":\"main\"}")
    fi
    ok=$(echo "$res" | python3 -c "import sys,json; print('✅' if json.load(sys.stdin).get('content') else '❌')" 2>/dev/null)
    echo "$ok $f"
    sleep 0.3
done

echo ""
echo "🎉 تم الانتهاء!"
echo "📰 الموقع: https://mimer2024yemen.github.io/Tae/"
echo "🔧 الإدارة: https://mimer2024yemen.github.io/Tae/admin"
