# Project Learnings & Incident Documentation

## 2026-09-24: HyperFrames Windows Render & Layout Validation Gate

### Context / Problem
- **Symptom:** HyperFrames video generation was failing to render or output the target MP4.
- **Errors observed:**
  - `[hyperframes] browserGpuMode probe → software (probe failed (Failed to launch the browser process: Code: 3221225595))`
  - `[Studio] Failed to launch thumbnail browser: spawn EPERM` / `Thumbnail: no browser available - Chrome may not be installed`
  - `npm run check` exited with code 1 due to 5 layout errors (`content_overlap`).

### Root Cause
1. **Windows Headless Shell Access Violation (Exit code 3221225595 / 0xC0000005):**
   Puppeteer's managed `chrome-headless-shell.exe` crashes at launch under certain Windows host configurations. HyperFrames CLI 0.8.68+ implements a fallback to system Chrome (`C:\Program Files\Google\Chrome\Application\chrome.exe`), but if invoked in an environment where system Chrome is not auto-detected or background thumbnail spawns hit permission barriers (`spawn EPERM`), rendering and thumbnail generation fail.
2. **Missing FFmpeg on PATH:**
   HyperFrames delegates final audio/video encoding and muxing to `ffmpeg` and `ffprobe`. Without them on the system PATH, render aborts at audio processing or video assembly.
3. **Workflow Check Gate Blockers (`content_overlap`):**
   The `product-launch-video` skill enforces a strict pre-render gate requiring `npm run check` to pass with 0 errors. In scenes `01-account-moves-first.html` and `03-verified-input.html`, intentional typographic layering (tight line-heights and cross-fading ratio values `90%` -> `85%`) were flagged as layout content overlap because they lacked the framework attribute `data-layout-allow-overlap`.

### Solution & Best Practice
1. **Verify System Chrome & FFmpeg:**
   Ensure Google Chrome is installed at the standard location and FFmpeg is exposed via system PATH (e.g. via Winget `Gyan.FFmpeg.Essentials`).
2. **Declare Intentional Layout Layering:**
   When designing animated value transitions (e.g., number counters, crossfading labels, or tight display typography), annotate the container or overlapping spans with `data-layout-allow-overlap` so `hyperframes check` recognizes the layout as intentional.
3. **Direct Render Verification:**
   Run `npm run render` directly to test the system Chrome fallback pipeline and verify stream integrity with `ffprobe`.

### Key Takeaway & Prevention
Never bypass the layout linter with ad-hoc frame scrapers (e.g. custom HTTP frame receivers); mark intentional animations with `data-layout-allow-overlap`, verify system dependencies (Chrome + FFmpeg), and let the native CLI pipeline complete the render.

### Resolution & Verified Deliverables
- Applied `data-layout-allow-overlap` to `#rw01-title` in `01-account-moves-first.html` and `#rw03-ratios` in `03-verified-input.html`.
- `npm run check` passed cleanly (0 errors).
- Executed high-quality canonical render: `npx hyperframes render --quality high --output renders/video.mp4`.
- Verified `renders/video.mp4` with `ffprobe` (52.0s, 1080p, H.264 High Profile, AAC 48kHz stereo, 11.4 MB).

