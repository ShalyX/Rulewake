# HyperFrames Render Diagnosis & Resolution Report

## 1. Executive Summary

The render issue has been resolved, and the final production video has been rendered and verified:
- **Production Output:** [`renders/video.mp4`](file:///C:/Users/USER/Documents/Codex/2026-09-16/le/videos/rulewake-demo/renders/video.mp4)
- **Duration:** 52.0 seconds (1,560 frames @ 30 fps)
- **Resolution & Codecs:** 1920×1080 progressive, H.264 High Profile (Level 5.0), AAC 48 kHz stereo audio
- **File Size:** 11.4 MB
- **Quality Mode:** High

---

## 2. Root Causes Identified & Addressed

1. **Windows Headless Shell Crash (Exit code 3221225595 / `0xC0000005`):**
   Puppeteer's bundled `chrome-headless-shell` crashed upon launch under Windows. HyperFrames 0.8.68 safely recovers by falling back to system Google Chrome (`C:\Program Files\Google\Chrome\Application\chrome.exe`).
2. **FFmpeg Dependency:**
   Local video assembly requires FFmpeg/FFprobe in the PATH. The binaries exist under `bin/` and system PATH via Winget (`Gyan.FFmpeg.Essentials`).
3. **Pre-Render Check Gate Blockers:**
   The `product-launch-video` workflow halts before rendering when `npm run check` fails. 5 layout content overlap errors occurred in [`01-account-moves-first.html`](file:///C:/Users/USER/Documents/Codex/2026-09-16/le/videos/rulewake-demo/compositions/frames/01-account-moves-first.html) and [`03-verified-input.html`](file:///C:/Users/USER/Documents/Codex/2026-09-16/le/videos/rulewake-demo/compositions/frames/03-verified-input.html) because intentional multiline title staggers and ratio transitions (`90%` -> `85%`) lacked the `data-layout-allow-overlap` attribute.

---

## 3. Actions Executed

1. **Scene 01 Fix:** Added `data-layout-allow-overlap` to `#rw01-title` and child spans in [`01-account-moves-first.html`](file:///C:/Users/USER/Documents/Codex/2026-09-16/le/videos/rulewake-demo/compositions/frames/01-account-moves-first.html).
2. **Scene 03 Fix:** Added `data-layout-allow-overlap` to `#rw03-ratios` and child elements (`#rw03-old`, `#rw03-new`, `#rw03-to`) in [`03-verified-input.html`](file:///C:/Users/USER/Documents/Codex/2026-09-16/le/videos/rulewake-demo/compositions/frames/03-verified-input.html).
3. **Verification Gate:** Ran `npm run check` → **Passed with 0 errors**.
4. **Production Render:** Ran `npx hyperframes render --quality high --output renders/video.mp4` → **100% complete**.
5. **Stream Verification:** Validated `renders/video.mp4` using `ffprobe` (all 1,560 frames, video + audio streams healthy).
6. **Documentation:** Recorded learnings in [`LEARNINGS.md`](file:///C:/Users/USER/Documents/Codex/2026-09-16/le/videos/rulewake-demo/LEARNINGS.md).
