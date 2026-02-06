#!/bin/bash

echo "🔍 ITSON FSM Deployment Verification"
echo "======================================"
echo ""

# Check git status
echo "📁 Git Status:"
git status --short
if [ $? -eq 0 ] && [ -z "$(git status --short)" ]; then
    echo "✅ Working tree clean - all changes committed"
else
    echo "⚠️  Uncommitted changes found"
fi
echo ""

# Check latest commit
echo "📝 Latest Commit:"
git log -1 --oneline
echo ""

# Check branch
echo "🌿 Current Branch:"
git branch --show-current
echo ""

# Verify admin panel files exist
echo "🗂️  Admin Panel Files:"
if [ -f "src/pages/AdminPanelPage.tsx" ]; then
    echo "✅ AdminPanelPage.tsx exists"
else
    echo "❌ AdminPanelPage.tsx missing"
fi

if [ -d "src/components/admin/tabs" ]; then
    echo "✅ Admin tabs directory exists"
    echo "   Files: $(ls src/components/admin/tabs/*.tsx 2>/dev/null | wc -l) tab components"
else
    echo "❌ Admin tabs directory missing"
fi
echo ""

# Check netlify config
echo "⚙️  Netlify Configuration:"
if [ -f "netlify.toml" ]; then
    echo "✅ netlify.toml exists"
    echo "   Mock API: $(grep 'VITE_USE_MOCK_API' netlify.toml | head -1)"
else
    echo "❌ netlify.toml missing"
fi
echo ""

# Try to build (just check if command exists)
echo "🏗️  Build Check:"
if command -v npm &> /dev/null; then
    echo "✅ npm is available"
    echo "   Running build test..."
    npm run build > /tmp/build.log 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ Build successful!"
        echo "   Build output in dist/"
    else
        echo "❌ Build failed - check /tmp/build.log"
    fi
else
    echo "⚠️  npm not found in PATH"
fi
echo ""

# Check if deployed to Netlify
echo "🌐 Deployment Info:"
echo "   Branch: claude/yetomo-pwa-platform-ZaYeQ"
echo "   Latest commit should trigger auto-deploy on Netlify"
echo ""

echo "✅ Verification Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Check Netlify dashboard for latest deploy"
echo "2. Verify deploy shows commit: $(git log -1 --format=%h)"
echo "3. Open site in INCOGNITO mode (no cache)"
echo "4. Login: admin@itsonfsm.com / password123"
echo "5. Navigate to Admin Panel"
echo "6. Verify 6 tabs are visible"
echo ""
echo "🆘 If issues persist:"
echo "   - Read NETLIFY_TROUBLESHOOTING.md"
echo "   - Clear browser cache (Ctrl+Shift+R)"
echo "   - Clear service worker in DevTools"
echo "   - Try different browser"
