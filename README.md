# FeralImages 🖼️
> A smart browser extension for Brave & Chrome to enhance standalone image viewing.

When you open an image directly in a browser tab, **FeralImages** automatically maximizes and fits the image to your viewport, gives you butter-smooth mouse wheel zooming centered on your cursor, and allows instant 90° rotation using keyboard shortcuts.

---

## 🌟 Key Features

1. **Auto Fit to Screen**:
   - Automatically detects direct image tabs and scales the image to fit your screen bounds while preserving original aspect ratio.

2. **Cursor-Centered Mouse Wheel Zoom**:
   - Scroll up to zoom in, scroll down to zoom out.
   - Zooming is anchored precisely under your mouse cursor for intuitive navigation.

3. **Shift + Arrow Key Rotation**:
   - **`Shift` + `←` (Left Arrow)**: Rotates image 90° counter-clockwise (-90°).
   - **`Shift` + `→` (Right Arrow)**: Rotates image 90° clockwise (+90°).

4. **Pan & Drag**:
   - Click and drag with left mouse button to pan smoothly across large images when zoomed in.

5. **Double-Click Toggle**:
   - Double-click anywhere to switch between **Fit to Screen** and **100% Actual Size (1:1)**.

6. **Floating HUD & Controls**:
   - Minimalist overlay showing live zoom percentage (e.g. `145%`) and rotation angle (e.g. `90°`).
   - Includes quick-action buttons for rotation, fitting, and 1:1 scaling.

---

## 🚀 How to Install in Brave Browser

1. Open **Brave Browser**.
2. In the address bar, navigate to `brave://extensions` (or `chrome://extensions` in Chrome).
3. In the top-right corner of the Extensions page, enable **Developer mode** toggle.
4. Click the **Load unpacked** button in the top left toolbar.
5. Select the project folder:
   ```text
   /var/home/Eremite/Documents/Projects/FeralImages
   ```
6. The extension **FeralImages - Image Viewer** is now installed!

---

## 🎮 Keyboard Shortcuts Reference

| Shortcut | Action |
| :--- | :--- |
| **`Shift` + `←`** | Rotate 90° counter-clockwise |
| **`Shift` + `→`** | Rotate 90° clockwise |
| **`Double-Click`** | Toggle Fit Screen vs 1:1 Actual Size |
| **`Mouse Wheel`** | Zoom in / out at cursor location |
| **`R` / `0`** | Reset zoom, position, and rotation |
| **`F`** | Fit image to screen |
| **`1`** | Set to 1:1 native image size |

---

## 📁 File Structure

```text
FeralImages/
├── manifest.json       # Chrome Manifest V3 configuration
├── content.js          # Main content script (detection, zoom, rotation, pan, HUD)
├── styles.css          # Viewport, stage, dark canvas grid, & HUD styling
├── icons/              # Generated extension icons (16px, 48px, 128px)
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── generate_icons.py   # Icon generation script
├── test_logic.js       # Node.js automated unit tests
├── demo.html           # Standalone HTML test page
└── README.md           # Documentation & installation guide
```
