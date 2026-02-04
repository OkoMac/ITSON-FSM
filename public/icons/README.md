# PWA Icons

This folder should contain the following icon files for the Progressive Web App:

## Required Icons

| File | Size | Purpose |
|------|------|---------|
| icon-72.png | 72x72 | Small devices |
| icon-96.png | 96x96 | Standard mobile |
| icon-128.png | 128x128 | High-res mobile |
| icon-144.png | 144x144 | Windows tile |
| icon-152.png | 152x152 | iPad |
| icon-192.png | 192x192 | Android Chrome |
| icon-384.png | 384x384 | High-res displays |
| icon-512.png | 512x512 | Splash screens |

## Shortcut Icons

| File | Size | Purpose |
|------|------|---------|
| check-in.png | 96x96 | Check-in shortcut |
| tasks.png | 96x96 | Tasks shortcut |
| dashboard.png | 96x96 | Dashboard shortcut |

## How to Generate Icons

### Option 1: Use a PWA Icon Generator

Visit: https://www.pwabuilder.com/imageGenerator

1. Upload your logo (minimum 512x512 PNG)
2. Select "Generate Icons"
3. Download and extract to this folder

### Option 2: Use ImageMagick (Command Line)

```bash
# Install ImageMagick
sudo apt-get install imagemagick  # Ubuntu/Debian
brew install imagemagick          # macOS

# Generate all sizes from a single 512x512 source
convert icon-512.png -resize 72x72 icon-72.png
convert icon-512.png -resize 96x96 icon-96.png
convert icon-512.png -resize 128x128 icon-128.png
convert icon-512.png -resize 144x144 icon-144.png
convert icon-512.png -resize 152x152 icon-152.png
convert icon-512.png -resize 192x192 icon-192.png
convert icon-512.png -resize 384x384 icon-384.png
```

### Option 3: Use Online Tools

- **Favicon Generator**: https://realfavicongenerator.net/
- **PWA Asset Generator**: https://github.com/elegantapp/pwa-asset-generator
- **App Icon Generator**: https://appicon.co/

## Design Guidelines

### Logo Requirements
- Format: PNG with transparency
- Minimum size: 512x512 pixels
- Safe zone: Keep important elements within 80% of canvas
- Background: Transparent or solid color
- Style: Simple, recognizable at small sizes

### Color Scheme (ITSON FSM)
- Primary: #00d9ff (Cyan)
- Secondary: #0066ff (Blue)
- Background: #0a0a0a (Dark)
- Accent: #ff00ff (Magenta)

### Maskable Icons
For icons marked as "maskable" in the manifest (icon-192.png and icon-512.png):
- Add 20% padding around logo
- Ensure logo doesn't touch edges
- Test with different mask shapes (circle, squircle, rounded square)

## Testing Icons

### Browser DevTools
1. Open Chrome DevTools
2. Go to Application > Manifest
3. Verify all icons load correctly
4. Check icon appearance in different contexts

### PWA Builder Test
Visit: https://www.pwabuilder.com/

1. Enter your site URL
2. Click "Test"
3. Review icon scores and recommendations

### Lighthouse Audit
Run Lighthouse in Chrome DevTools:
- PWA category should show green for icons
- Maskable icon should be detected
- All sizes should be present

## Current Status

⚠️ **PLACEHOLDER ICONS NEEDED**

To complete PWA setup, add proper icons to this folder.

Temporary solution: Use a solid color placeholder:
```bash
# Create simple placeholder (requires ImageMagick)
convert -size 512x512 xc:#00d9ff icon-512.png
convert icon-512.png -resize 192x192 icon-192.png
convert icon-512.png -resize 144x144 icon-144.png
# ... etc
```

## Screenshots (for App Stores)

The `/public/screenshots/` folder should contain:

| File | Size | Purpose |
|------|------|---------|
| dashboard.png | 540x720 | Mobile screenshot |
| tasks.png | 1280x720 | Desktop/tablet screenshot |

### Screenshot Guidelines
- Show actual app content
- No device frames
- High contrast
- Text should be readable
- Highlight key features

## Apple-Specific Icons

For optimal iOS experience:

| File | Size | Purpose |
|------|------|---------|
| apple-touch-icon.png | 180x180 | iOS home screen |
| apple-touch-icon-152x152.png | 152x152 | iPad |

Place these in `/public/` root directory.

## Windows Tile Configuration

Create `/public/browserconfig.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
  <msapplication>
    <tile>
      <square150x150logo src="/icons/icon-144.png"/>
      <TileColor>#0a0a0a</TileColor>
    </tile>
  </msapplication>
</browserconfig>
```

## Troubleshooting

### Icons Not Showing
1. Clear browser cache
2. Verify file paths in manifest.json
3. Check file permissions (should be readable)
4. Validate PNG format (no corruption)

### Wrong Icon Displays
1. Check purpose: "any" vs "maskable"
2. Verify sizes match manifest
3. Test in different browsers
4. Check for caching issues

### Install Prompt Not Appearing
1. Ensure all required icons present
2. Verify HTTPS (required for PWA)
3. Check manifest.json validity
4. Review browser console for errors

## Resources

- [Web App Manifest Docs](https://web.dev/add-manifest/)
- [Icon Design Guide](https://web.dev/maskable-icon/)
- [PWA Checklist](https://web.dev/pwa-checklist/)
- [App Icon Sizes Reference](https://developer.apple.com/design/human-interface-guidelines/app-icons)
