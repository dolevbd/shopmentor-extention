# ShopMentor AI Chrome Extension

This folder contains **ONLY** the files needed for the Chrome extension.

## Files Included

- `manifest.json` - Extension manifest
- `background.js` - Background service worker (connects to external server)
- `content.js` - Content script for product detection and UI
- `popup.js` - Popup script
- `popup.html` - Popup UI
- `styles.css` - Extension styles

## Installation in Chrome

1. Open `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select this `extension` folder
5. Extension is now installed and ready to use!

## Upload to Chrome Web Store

1. Zip this entire `extension` folder
2. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
3. Click "New Item"
4. Upload the zip file
5. Fill in store listing details
6. Submit for review

## Important Notes

- ✅ **No API keys** in extension code - all secure!
- ✅ Extension connects to server: `https://shopmentor-server-api.onrender.com`
- ✅ All API calls go through secure backend server
- ✅ Multi-language support (Hebrew, English, Arabic, Russian, Spanish, French, German)

## Testing

After loading the extension:
1. Go to Amazon or AliExpress
2. Open any product page
3. Hover over "Add to Cart" button
4. You should see shopping advice popup!
