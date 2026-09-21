# PWA Icons

Icons have been added as SVG files:
- `icon-192.svg` - 192x192 pixels (for Android)
- `icon-512.svg` - 512x512 pixels (for iOS)

These are simple green squares with "DB" text as placeholders.

## For Production:

For a more professional look, you should:

1. **Create branded icons** using your actual logo:
   - Go to https://realfavicongenerator.net/
   - Upload your DailyBloom logo
   - Select "Android" and "iOS"
   - Download the generated icons
   - Replace the SVG files with PNG versions

2. **Or use an online SVG to PNG converter**:
   - Go to https://cloudconvert.com/svg-to-png
   - Convert `icon-192.svg` to `icon-192.png`
   - Convert `icon-512.svg` to `icon-512.png`
   - Update `manifest.json` to reference PNG files instead of SVG

## Current Status:
- ✅ Icons added (SVG format)
- ✅ Manifest configured
- ✅ PWA ready for testing
- ⚠️ Icons are placeholders (upgrade for production)

## Testing PWA:
1. Open https://dailybloom-management-portal.onrender.com on mobile Chrome/Safari
2. Tap menu → "Add to Home Screen"
3. The app should appear on your home screen with the DB icon
