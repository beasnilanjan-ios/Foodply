Download the League Spartan font (TTF) and place the fonts inside this folder.

Files to add (example):
- LeagueSpartan-Regular.ttf
- LeagueSpartan-Bold.ttf

iOS
1. After adding the .ttf files to `src/fonts`, run:

   cd ios
   pod install

2. Clean and rebuild from Xcode (Product → Clean Build Folder), then run the app.

Android
1. After adding the .ttf files to `src/fonts`, run:

   npx react-native-asset

or (React Native < 0.60)

   npx react-native link

2. Rebuild the Android app:

   npx react-native run-android

Notes
- This repository includes `react-native.config.js` pointing to `src/fonts` so `npx react-native-asset` or `npx react-native link` will copy fonts to native projects.
- Font family name to use in styles: use the internal postscript name reported by the font. A common value is `"LeagueSpartan"` or `"League Spartan"`. If in doubt, open the TTF and check the font family name.
- If you want me to download the font and wire it in the repo, I can add the TTF files here if you confirm licensing is acceptable for your project.
