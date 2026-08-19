/**
 * FeralImages - Standalone Image Viewer Content Script
 * 
 * Features:
 * - Standalone image tab & base64 data:image URIs detection (JPEG, PNG, WEBP, GIF, SVG)
 * - Auto-fit image to screen bounds upon load
 * - Smooth mouse wheel zooming centered at cursor
 * - Shift + Left/Right Arrow rotation (90° steps)
 * - Click and drag panning locked to screen edges (10px margin constraint)
 * - Double-click toggle (Fit vs 1:1 actual size)
 * - Ultra-compact HUD overlay showing ONLY during zoom or rotation (auto-hides after 1 second of inactivity, stays visible while mouse hovers over HUD)
 * - MutationObserver & Polling for instant detection of Chromium async data:image <img> tags
 */

(function () {
  'use strict';
  if (window.__feralImagesLoaded) return;
  window.__feralImagesLoaded = true;

  // Viewer state
  let imgElement = null;
  let viewportEl = null;
  let stageEl = null;
  let hudEl = null;
  let hudInfoEl = null;

  let scale = 1.0;
  let rotation = 0; // in degrees
  let translateX = 0;
  let translateY = 0;
  let fitScale = 1.0;
  let isFitMode = true;

  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let initialTranslateX = 0;
  let initialTranslateY = 0;

  let hudTimeout = null;
  let isHoveringHUD = false;

  /**
   * Check if current tab is a standalone image tab or direct base64 data:image/... URI
   */
  function isStandaloneImage() {
    const href = (window.location.href || '').toLowerCase();
    const protocol = (window.location.protocol || '').toLowerCase();

    // 1. Direct data:image URI check
    if (protocol === 'data:' || href.startsWith('data:image')) {
      return true;
    }

    // 2. ContentType check
    if (document.contentType && document.contentType.toLowerCase().startsWith('image/')) {
      return true;
    }

    // 3. Document body inspection matching standard Chromium standalone image DOM
    const body = document.body;
    if (body) {
      const imgs = body.getElementsByTagName('img');
      if (imgs.length === 1) {
        const imgSrc = (imgs[0].src || '').toLowerCase();
        // If single image in body and either empty inner text or data image
        if (imgSrc.startsWith('data:image') || imgs[0].parentNode === body) {
          const nonImgChildren = Array.from(body.children).filter(
            (el) => el.tagName !== 'IMG' && el.tagName !== 'SCRIPT' && el.tagName !== 'STYLE' && el.id !== 'feral-image-viewport'
          );
          if (nonImgChildren.length === 0) {
            return true;
          }
        }
      }
    }

    // 4. Fallback check for single standalone img element in document with base64 src
    if (document.images && document.images.length === 1) {
      const src = (document.images[0].src || '').toLowerCase();
      if (src.startsWith('data:image')) {
        return true;
      }
    }

    // 5. Fallback: URL extension check combined with single image tag body
    const cleanUrl = href.split('?')[0].split('#')[0];
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.avif', '.ico'];
    const isImgUrl = imageExtensions.some((ext) => cleanUrl.endsWith(ext));

    if (isImgUrl && body && document.querySelectorAll('img').length === 1) {
      if (!body.innerText || body.innerText.trim() === '') {
        return true;
      }
    }

    return false;
  }

  /**
   * Calculate bounding width and height considering rotation angle
   */
  function getRotatedBounds(w, h, angleDeg) {
    const rad = (((angleDeg % 360) + 360) % 360) * (Math.PI / 180);
    const boundWidth = Math.abs(w * Math.cos(rad)) + Math.abs(h * Math.sin(rad));
    const boundHeight = Math.abs(w * Math.sin(rad)) + Math.abs(h * Math.cos(rad));
    return { boundWidth, boundHeight };
  }

  /**
   * Compute the scale required to fit image cleanly into viewport
   */
  function calculateFitScale() {
    if (!imgElement) return 1.0;

    const naturalW = imgElement.naturalWidth || imgElement.clientWidth || 800;
    const naturalH = imgElement.naturalHeight || imgElement.clientHeight || 600;

    const { boundWidth, boundHeight } = getRotatedBounds(naturalW, naturalH, rotation);

    // Provide 20px margin around screen edge
    const padding = 20;
    const vw = Math.max(100, window.innerWidth - padding * 2);
    const vh = Math.max(100, window.innerHeight - padding * 2);

    return Math.min(vw / boundWidth, vh / boundHeight);
  }

  /**
   * Clamp translateX and translateY so image edges stay locked to screen bounds (10px margin constraint)
   */
  function clampTranslation() {
    if (!imgElement) return;

    const naturalW = imgElement.naturalWidth || imgElement.clientWidth || 800;
    const naturalH = imgElement.naturalHeight || imgElement.clientHeight || 600;

    const { boundWidth, boundHeight } = getRotatedBounds(naturalW, naturalH, rotation);

    const renderedW = boundWidth * scale;
    const renderedH = boundHeight * scale;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const margin = 10;

    const valY1 = margin - vh / 2 + renderedH / 2;
    const valY2 = vh / 2 - margin - renderedH / 2;
    const minY = Math.min(valY1, valY2);
    const maxY = Math.max(valY1, valY2);
    translateY = Math.max(minY, Math.min(maxY, translateY));

    const valX1 = margin - vw / 2 + renderedW / 2;
    const valX2 = vw / 2 - margin - renderedW / 2;
    const minX = Math.min(valX1, valX2);
    const maxX = Math.max(valX1, valX2);
    translateX = Math.max(minX, Math.min(maxX, translateX));
  }

  /**
   * Apply calculated scale and translate matrix transform to stage element
   */
  function updateTransform(animate = false) {
    if (!stageEl) return;

    // Enforce edge locking boundary constraint
    clampTranslation();

    if (animate) {
      stageEl.classList.add('animated');
      setTimeout(() => stageEl.classList.remove('animated'), 260);
    }

    stageEl.style.transform = `translate3d(calc(-50% + ${translateX}px), calc(-50% + ${translateY}px), 0) scale(${scale}) rotate(${rotation}deg)`;

    updateHUDInfo();
  }

  /**
   * Update HUD display text
   */
  function updateHUDInfo() {
    if (!hudInfoEl) return;
    const zoomPct = Math.round(scale * 100);
    const normAngle = ((rotation % 360) + 360) % 360;
    hudInfoEl.textContent = `${zoomPct}% | ${normAngle}°`;
  }

  /**
   * Show HUD ONLY on zoom or rotation activity; auto-hide after 1 second (1000ms) unless mouse hovers over HUD
   */
  function triggerHUD() {
    if (!hudEl) return;
    hudEl.classList.remove('hud-hidden');
    clearTimeout(hudTimeout);

    if (!isHoveringHUD) {
      hudTimeout = setTimeout(() => {
        if (!isHoveringHUD) {
          hudEl.classList.add('hud-hidden');
        }
      }, 1000);
    }
  }

  /**
   * Fit image to screen bounds
   */
  function fitToScreen(animate = true, showHUD = false) {
    fitScale = calculateFitScale();
    scale = fitScale;
    translateX = 0;
    translateY = 0;
    isFitMode = true;
    updateTransform(animate);
    if (showHUD) triggerHUD();
  }

  /**
   * Rotate image by delta degrees (+90 or -90)
   */
  function rotateBy(deltaDegrees) {
    rotation += deltaDegrees;

    if (isFitMode) {
      fitToScreen(true, false);
    } else {
      updateTransform(true);
    }
    triggerHUD();
  }

  /**
   * Handle mouse wheel zoom centered at cursor
   */
  function handleWheel(e) {
    e.preventDefault();

    // Trigger HUD on zoom activity
    triggerHUD();

    // Standardize delta
    const delta = -e.deltaY;
    const factor = delta > 0 ? 1.15 : 1 / 1.15;

    const minScale = Math.min(fitScale * 0.1, 0.05);
    const maxScale = 50.0;

    const newScale = Math.max(minScale, Math.min(maxScale, scale * factor));
    if (newScale === scale) return;

    // Viewport center relative mouse position
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cx = e.clientX - vw / 2;
    const cy = e.clientY - vh / 2;

    const scaleRatio = newScale / scale;

    translateX = cx - (cx - translateX) * scaleRatio;
    translateY = cy - (cy - translateY) * scaleRatio;
    scale = newScale;
    isFitMode = false;

    updateTransform(false);
  }

  /**
   * Mouse Drag (Pan) Handlers
   */
  function handleMouseDown(e) {
    if (e.button !== 0) return; // Only left-click
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    initialTranslateX = translateX;
    initialTranslateY = translateY;

    viewportEl.classList.add('is-dragging');
    e.preventDefault();
  }

  function handleMouseMove(e) {
    if (!isDragging) return;

    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;

    translateX = initialTranslateX + dx;
    translateY = initialTranslateY + dy;
    isFitMode = false;

    updateTransform(false);
  }

  function handleMouseUp() {
    if (!isDragging) return;
    isDragging = false;
    if (viewportEl) viewportEl.classList.remove('is-dragging');
  }

  /**
   * Double Click handler (Toggle Fit vs 100% 1:1 scale)
   */
  function handleDoubleClick(e) {
    e.preventDefault();
    if (Math.abs(scale - fitScale) < 0.05 && Math.abs(scale - 1.0) >= 0.05) {
      // Switch to 1:1 native scale centered on double click location
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const cx = e.clientX - vw / 2;
      const cy = e.clientY - vh / 2;

      const scaleRatio = 1.0 / scale;
      translateX = cx - (cx - translateX) * scaleRatio;
      translateY = cy - (cy - translateY) * scaleRatio;
      scale = 1.0;
      isFitMode = false;
    } else {
      // Reset to Fit to Screen
      fitToScreen(true, false);
    }
    updateTransform(true);
    triggerHUD();
  }

  /**
   * Keyboard Shortcuts Handler
   */
  function handleKeyDown(e) {
    // Shift + Left Arrow / Shift + Right Arrow (Requirement)
    if (e.shiftKey && (e.key === 'ArrowLeft' || e.code === 'ArrowLeft')) {
      e.preventDefault();
      e.stopPropagation();
      rotateBy(-90);
      return;
    }

    if (e.shiftKey && (e.key === 'ArrowRight' || e.code === 'ArrowRight')) {
      e.preventDefault();
      e.stopPropagation();
      rotateBy(90);
      return;
    }

    // Additional shortcuts for user convenience
    if (e.key === 'r' || e.key === 'R' || e.key === '0') {
      rotation = 0;
      fitToScreen(true, true);
    } else if (e.key === 'f' || e.key === 'F') {
      fitToScreen(true, true);
    } else if (e.key === '1') {
      scale = 1.0;
      translateX = 0;
      translateY = 0;
      isFitMode = false;
      updateTransform(true);
      triggerHUD();
    }
  }

  /**
   * Create and attach the custom viewer DOM.
   * Returns true if setup succeeded (target image found and mounted), false otherwise.
   */
  function setupViewer() {
    if (document.getElementById('feral-image-viewport')) return true;

    const body = document.body;
    if (!body) return false;

    // Find target image source
    let srcImg = document.querySelector('body > img') || document.querySelector('img');
    if (!srcImg && document.images.length > 0) {
      srcImg = document.images[0];
    }
    if (!srcImg) return false;

    const imageSrc = srcImg.src;
    if (!imageSrc) return false;

    // Hide original image element so it doesn't duplicate
    srcImg.style.display = 'none';

    // Apply mode class to document
    document.documentElement.classList.add('feral-image-mode');
    document.body.classList.add('feral-image-mode');

    // Create Viewport
    viewportEl = document.createElement('div');
    viewportEl.id = 'feral-image-viewport';

    // Create Stage
    stageEl = document.createElement('div');
    stageEl.id = 'feral-image-stage';

    // Create Image Element
    imgElement = document.createElement('img');
    imgElement.id = 'feral-image-element';
    imgElement.src = imageSrc;

    stageEl.appendChild(imgElement);
    viewportEl.appendChild(stageEl);

    // Create HUD Overlay (starts hidden)
    hudEl = document.createElement('div');
    hudEl.id = 'feral-image-hud';
    hudEl.className = 'hud-hidden';

    // Prevent auto-hiding while mouse hovers over HUD
    hudEl.addEventListener('mouseenter', () => {
      isHoveringHUD = true;
      hudEl.classList.remove('hud-hidden');
      clearTimeout(hudTimeout);
    });

    hudEl.addEventListener('mouseleave', () => {
      isHoveringHUD = false;
      clearTimeout(hudTimeout);
      hudTimeout = setTimeout(() => {
        if (!isHoveringHUD) {
          hudEl.classList.add('hud-hidden');
        }
      }, 1000);
    });

    hudInfoEl = document.createElement('span');
    hudInfoEl.className = 'feral-hud-badge';
    hudInfoEl.textContent = '100% | 0°';

    const divider = document.createElement('div');
    divider.className = 'feral-hud-divider';

    const controls = document.createElement('div');
    controls.className = 'feral-hud-controls';

    function createBtn(title, iconSymbol, onClick) {
      const btn = document.createElement('button');
      btn.className = 'feral-hud-btn';
      btn.title = title;
      btn.innerHTML = iconSymbol;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        onClick();
      });
      return btn;
    }

    const btnRotateLeft = createBtn('Rotate Left 90° (Shift + ←)', '↺', () => rotateBy(-90));
    const btnRotateRight = createBtn('Rotate Right 90° (Shift + →)', '↻', () => rotateBy(90));
    const btnFit = createBtn('Fit to Screen (F)', '⛶', () => fitToScreen(true, true));
    const btnActual = createBtn('Actual Size 1:1 (1)', '1:1', () => {
      scale = 1.0;
      translateX = 0;
      translateY = 0;
      isFitMode = false;
      updateTransform(true);
      triggerHUD();
    });

    controls.appendChild(btnRotateLeft);
    controls.appendChild(btnRotateRight);
    controls.appendChild(btnFit);
    controls.appendChild(btnActual);

    const hints = document.createElement('div');
    hints.className = 'feral-hud-hints';
    hints.innerHTML = '<span class="feral-key-badge">Shift + ←/→</span> Rotate';

    hudEl.appendChild(hudInfoEl);
    hudEl.appendChild(divider);
    hudEl.appendChild(controls);
    hudEl.appendChild(hints);

    viewportEl.appendChild(hudEl);
    document.body.appendChild(viewportEl);

    // Setup Event Listeners
    viewportEl.addEventListener('wheel', handleWheel, { passive: false });
    viewportEl.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    viewportEl.addEventListener('dblclick', handleDoubleClick);
    window.addEventListener('keydown', handleKeyDown, true);

    window.addEventListener('resize', () => {
      if (isFitMode) {
        fitToScreen(false, false);
      } else {
        updateTransform(false);
      }
    });

    // Wait for image natural dimensions to calculate initial fit
    function onImgLoad() {
      fitToScreen(false, false);
    }

    if (imgElement.complete && imgElement.naturalWidth) {
      onImgLoad();
    } else {
      imgElement.addEventListener('load', onImgLoad);
    }

    return true;
  }

  /**
   * Main initialization with MutationObserver & Polling to catch async Chromium image tag creation
   */
  function init() {
    let initialized = false;
    let observer = null;
    let pollTimer = null;

    function attemptMount() {
      if (initialized) return;
      if (isStandaloneImage()) {
        if (setupViewer()) {
          initialized = true;
          if (observer) observer.disconnect();
          if (pollTimer) clearInterval(pollTimer);
        }
      }
    }

    // 1. Immediate attempt
    attemptMount();
    if (initialized) return;

    // 2. MutationObserver to catch <img> tag injection instantly
    observer = new MutationObserver(() => {
      attemptMount();
    });

    if (document.documentElement) {
      observer.observe(document.documentElement, { childList: true, subtree: true });
    }

    // 3. Short interval polling backup (runs for 3 seconds)
    const startTime = Date.now();
    pollTimer = setInterval(() => {
      attemptMount();
      if (Date.now() - startTime > 3000) {
        clearInterval(pollTimer);
        if (observer) observer.disconnect();
      }
    }, 30);

    // 4. DOM ready event listeners
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', attemptMount);
      window.addEventListener('load', attemptMount);
    }
  }

  init();
})();
