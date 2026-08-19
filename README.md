# FeralImages 👁️
> A smart, sleek browser extension for Brave & Chrome to enhance standalone image viewing.

When you open an image directly in a browser tab—whether via direct URL (`.png`, `.jpg`, `.webp`, `.svg`), local file (`file://`), or base64 data URI (`data:image/...`)—**FeralImages** automatically maximizes and fits the image to your viewport, provides butter-smooth cursor-anchored zooming, edge-locked panning, and instant 90° rotation shortcuts.

---

## 🌟 Features

- **Auto Fit to Screen**:
  Automatically scales images upon load to maximize space within your browser viewport while maintaining original aspect ratio.
- **Cursor-Centered Mouse Wheel Zoom**:
  Scroll up to zoom in, scroll down to zoom out. Zooming is anchored precisely under your mouse cursor for intuitive navigation.
- **Shift + Arrow Key Rotation**:
  - **`Shift` + `←` (Left Arrow)**: Rotates image 90° counter-clockwise (-90°).
  - **`Shift` + `→` (Right Arrow)**: Rotates image 90° clockwise (+90°).
- **Edge-Locked Panning**:
  Click and drag with left mouse button to pan around zoomed images. Edges are locked to a 10px screen threshold so images never get lost off-screen.
- **Double-Click Toggle**:
  Double-click anywhere to toggle between **Fit to Screen** and **100% Actual Size (1:1)**.
- **Solid Black Background**:
  Clean, distraction-free pure black background (`#000000`).
- **Flush Top-Right HUD**:
  Minimalist overlay anchored flush in the top-right corner displaying live zoom percentage (e.g., `125%`) and rotation angle (e.g., `90°`). Only appears during zoom or rotation activity and auto-hides after 1 second.
- **Base64 & Data URI Support**:
  Full support for top-level `data:image/png;base64,...`, `data:image/jpeg;base64,...`, and `data:image/svg+xml;...` URIs.

---

## 🚀 Installation

1. Open **Brave** (`brave://extensions`) or **Chrome** (`chrome://extensions`).
2. Enable **Developer mode** (toggle in the top-right corner).
3. Click **Load unpacked** (top-left button).
4. Select the **FeralImages** project directory.

> **Note for Local File URLs**: If you want to use the extension on local `file://` images, click **Details** on the FeralImages card in `brave://extensions` and enable **Allow access to file URLs**.

---

## 🎮 Controls & Shortcuts

| Action / Shortcut | Description |
| :--- | :--- |
| **`Shift` + `←`** | Rotate 90° counter-clockwise |
| **`Shift` + `→`** | Rotate 90° clockwise |
| **`Mouse Wheel`** | Zoom in / out anchored at cursor |
| **`Left Click + Drag`** | Pan image (locked to screen edges) |
| **`Double Click`** | Toggle Fit to Screen vs 1:1 Actual Size |
| **`R` / `0`** | Reset zoom, position, and rotation |
| **`F`** | Fit image to screen |
| **`1`** | Set to 1:1 actual native image size |

---

## 📁 Repository Structure

```text
FeralImages/
├── .github/workflows/
│   └── build-and-release.yml  # GitHub Actions CI/CD workflow
├── .gitignore                 # Excludes temporary build files & logs
├── LICENSE                    # GNU General Public License v3.0
├── README.md                  # Extension documentation & user guide
├── background.js              # Background service worker for data URIs
├── content.js                 # Main content script (detection, zoom, pan, rotation, HUD)
├── styles.css                 # Viewport styling & top-right HUD layout
├── manifest.json              # Chrome Manifest V3 configuration
├── test_logic.js              # Node.js automated unit test suite
└── icons/                     # Extension icons (16px, 48px, 128px)
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

---

## 📄 License

This project is licensed under the [GNU General Public License v3.0](LICENSE).
