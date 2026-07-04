#!/bin/bash
# ============================================
#  سكربت رفع عاجل نيوز - التصنيف الذكي
#  Usage: bash PUSH.sh YOUR_TOKEN
# ============================================
T=$1
REPO="mimer2024yemen/Tae"
[ -z "$T" ] && echo "❌ Usage: bash PUSH.sh YOUR_GITHUB_TOKEN" && exit 1

cd "$(dirname "$0")"
echo "🚀 رفع عاجل نيوز مع نظام التصنيف الذكي..."

upload() {
    local f=$1
    [ ! -f "$f" ] && echo "⚠️ $f not found" && return
    local content=$(base64 -w0 "$f")
    local sha=$(curl -s -H "Authorization: token $T" "https://api.github.com/repos/$REPO/contents/$f" | python3 -c "import sys,json; print(json.load(sys.stdin).get('sha',''))" 2>/dev/null)
    
    local body
    if [ -n "$sha" ]; then
        body="{\"message\":\"update\",\"content\":\"$content\",\"sha\":\"$sha\",\"branch\":\"main\"}"
    else
        body="{\"message\":\"add\",\"content\":\"$content\",\"branch\":\"main\"}"
    fi
    
    local res=$(curl -s -X PUT -H "Authorization: token $T" -H "Content-Type: application/json" "https://api.github.com/repos/$REPO/contents/$f" -d "$body")
    local ok=$(echo "$res" | python3 -c "import sys,json; print('✅' if json.load(sys.stdin).get('content') else '❌ '+json.load(sys.stdin).get('message',''))" 2>/dev/null)
    echo "$ok $f"
    sleep 0.5
}

# Core files
for f in server.js database.js news-fetcher.js package.json; do upload "$f"; done

# Admin
for f in admin/index.html admin/admin.css admin/admin.js; do upload "$f"; done

# Public
for f in public/index.html public/style.css public/script.js public/section.html public/news-live.js public/categorizer.js; do upload "$f"; done

# GitHub Action
for f in .github/workflows/fetch-news.yml .github/scripts/fetch-news.js; do upload "$f"; done

# Data files (may be large)
echo ""
echo "📊 رفع بيانات الأخبار..."
for f in public/data/news.json public/data/latest.json public/data/news-international.json public/data/news-sports.json public/data/news-economy.json public/data/news-entertainment.json public/data/news-tourism.json; do
    upload "$f"
done

echo ""
echo "🎉 تم الرفع بنجاح!"
echo "🌐 https://mimer2024yemen.github.io/Tae/"
echo "🔧 https://mimer2024yemen.github.io/Tae/admin (admin/admin123)"
