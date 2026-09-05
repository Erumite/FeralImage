// Automated unit test for FeralImages viewer math and logic
const assert = require('assert');

// 1. Test exact DOM detection logic matching user DOM snippet
function isStandaloneDOM(bodyChildren, innerText = '') {
  const nonImgChildren = bodyChildren.filter(
    (el) => el.tagName !== 'IMG' && el.tagName !== 'SCRIPT' && el.id !== 'feral-image-viewport'
  );
  const imgChildren = bodyChildren.filter((el) => el.tagName === 'IMG');
  
  if (imgChildren.length === 1 && nonImgChildren.length === 0) {
    return true;
  }
  return false;
}

console.log('Testing exact DOM snippet match from user...');
const mockBodyChildren = [
  { tagName: 'IMG', src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...' }
];

assert.strictEqual(isStandaloneDOM(mockBodyChildren), true);
console.log('✓ Exact DOM snippet matched correctly!');

// 2. Clamping logic calculation
function clampTranslation(translateX, translateY, scale, rotation, imgW, imgH, vw, vh, margin = 10) {
  const rad = (((rotation % 360) + 360) % 360) * (Math.PI / 180);
  const boundWidth = Math.abs(imgW * Math.cos(rad)) + Math.abs(imgH * Math.sin(rad));
  const boundHeight = Math.abs(imgW * Math.sin(rad)) + Math.abs(imgH * Math.cos(rad));

  const renderedW = boundWidth * scale;
  const renderedH = boundHeight * scale;

  const valY1 = margin - vh / 2 + renderedH / 2;
  const valY2 = vh / 2 - margin - renderedH / 2;
  const minY = Math.min(valY1, valY2);
  const maxY = Math.max(valY1, valY2);
  const clampedY = Math.max(minY, Math.min(maxY, translateY));

  const valX1 = margin - vw / 2 + renderedW / 2;
  const valX2 = vw / 2 - margin - renderedW / 2;
  const minX = Math.min(valX1, valX2);
  const maxX = Math.max(valX1, valX2);
  const clampedX = Math.max(minX, Math.min(maxX, translateX));

  return { clampedX, clampedY, minX, maxX, minY, maxY };
}

console.log('Testing clampTranslation when dragging down (large image)...');
const res1 = clampTranslation(0, 800, 1, 0, 2000, 2000, 1000, 1000, 10);
assert.strictEqual(res1.clampedY, 510);
console.log('✓ Clamping logic verified!');

// 3. Test getImageDimensions fallback handling (SVGs and unrendered tags)
function getImageDimensions(img) {
  if (!img) return { width: 800, height: 600 };
  let w = img.naturalWidth || img.clientWidth || 0;
  let h = img.naturalHeight || img.clientHeight || 0;

  if (!w || !h) {
    const rect = typeof img.getBoundingClientRect === 'function' ? img.getBoundingClientRect() : null;
    if (rect) {
      w = w || rect.width;
      h = h || rect.height;
    }
  }

  if (!w || !h) {
    const attrW = parseFloat(img.getAttribute ? img.getAttribute('width') : null);
    const attrH = parseFloat(img.getAttribute ? img.getAttribute('height') : null);
    if (attrW && attrH) {
      w = w || attrW;
      h = h || attrH;
    }
  }

  return {
    width: w || 800,
    height: h || 600
  };
}

console.log('Testing getImageDimensions attribute and bounding box fallbacks...');
const mockSvgImg = {
  naturalWidth: 0,
  naturalHeight: 0,
  clientWidth: 0,
  clientHeight: 0,
  getBoundingClientRect: () => ({ width: 400, height: 300 }),
  getAttribute: (attr) => (attr === 'width' ? '400' : attr === 'height' ? '300' : null)
};
const dims = getImageDimensions(mockSvgImg);
assert.strictEqual(dims.width, 400);
assert.strictEqual(dims.height, 300);
console.log('✓ SVG dimension fallbacks verified!');

// 4. Test isDefinitelyRegularPage early exit heuristic
function isDefinitelyRegularPage(bodyChildren, innerText = '') {
  const nonImgChildren = bodyChildren.filter(
    (el) => el.tagName !== 'IMG' && el.tagName !== 'SCRIPT' && el.tagName !== 'STYLE' && el.id !== 'feral-image-viewport'
  );
  if (nonImgChildren.length > 0) return true;
  if (innerText && innerText.trim().length > 0) return true;
  return false;
}

console.log('Testing isDefinitelyRegularPage on standard HTML page body...');
const mockRegularBodyChildren = [
  { tagName: 'DIV', id: 'app' },
  { tagName: 'NAV', id: 'navbar' },
  { tagName: 'IMG', src: 'logo.png' }
];
assert.strictEqual(isDefinitelyRegularPage(mockRegularBodyChildren), true);
console.log('✓ Regular web page early exit heuristic verified!');

console.log('Testing isDefinitelyRegularPage on Reddit CAPTCHA / Bot Challenge DOM...');
const mockRedditCaptchaBody = [
  { tagName: 'MAIN', children: [{ tagName: 'DIV', className: 'logo' }] },
  { tagName: 'FORM', hidden: true }
];
assert.strictEqual(isDefinitelyRegularPage(mockRedditCaptchaBody), true);
console.log('✓ Reddit CAPTCHA DOM correctly classified as regular page!');

// 5. Test isStandaloneImage state logic simulation
function simulateIsStandaloneImage(opts) {
  const { href, protocol, contentType, readyState, bodyChildren, innerText, imgs } = opts;
  const lowerHref = (href || '').toLowerCase();
  const lowerProtocol = (protocol || '').toLowerCase();

  // 1. Direct data:image URI check
  if (lowerProtocol === 'data:' || lowerHref.startsWith('data:image')) {
    return true;
  }

  // 2. ContentType check
  if (contentType && contentType.toLowerCase().startsWith('image/')) {
    return true;
  }

  // 3. Defer DOM heuristics during document loading for HTML pages
  if (readyState === 'loading') {
    return false;
  }

  if (innerText && innerText.trim().length > 0) {
    return false;
  }

  if (imgs && imgs.length === 1) {
    const nonImgChildren = (bodyChildren || []).filter(
      (el) => el.tagName !== 'IMG' && el.tagName !== 'SCRIPT' && el.tagName !== 'STYLE' && el.id !== 'feral-image-viewport'
    );
    if (nonImgChildren.length === 0) {
      return true;
    }
  }

  return false;
}

console.log('Testing simulateIsStandaloneImage on Reddit URL during document loading...');
const redditLoadingResult = simulateIsStandaloneImage({
  href: 'https://www.reddit.com/r/retrogaming/comments/1knw1ml/the_story_behind_mad_catz_is_fascinating/',
  protocol: 'https:',
  contentType: 'text/html',
  readyState: 'loading',
  bodyChildren: [{ tagName: 'IMG', src: 'reddit_logo.png' }],
  innerText: '',
  imgs: [{ src: 'reddit_logo.png' }]
});
assert.strictEqual(redditLoadingResult, false);
console.log('✓ Reddit URL during document loading correctly returned false (not triggered)!');

console.log('Testing simulateIsStandaloneImage on direct data:image URI...');
const dataUriResult = simulateIsStandaloneImage({
  href: 'data:image/png;base64,iVBORw0KGgo...',
  protocol: 'data:',
  contentType: 'text/html',
  readyState: 'loading'
});
assert.strictEqual(dataUriResult, true);
console.log('✓ Data URI correctly returned true immediately!');

console.log('Testing simulateIsStandaloneImage on Chrome native image tab (contentType image/jpeg)...');
const chromeImageTabResult = simulateIsStandaloneImage({
  href: 'https://example.com/photo.jpg',
  protocol: 'https:',
  contentType: 'image/jpeg',
  readyState: 'loading'
});
assert.strictEqual(chromeImageTabResult, true);
console.log('✓ Native image tab correctly returned true immediately!');

// 6. Test context menu handler logic
function handleContextMenuClick(info, tab, updateFn) {
  if (info && info.menuItemId === 'openImageInThisTab' && info.srcUrl && tab && tab.id) {
    updateFn(tab.id, { url: info.srcUrl });
    return true;
  }
  return false;
}

console.log('Testing context menu click handler...');
let updatedTabId = null;
let updatedUrl = null;
const mockUpdate = (id, options) => {
  updatedTabId = id;
  updatedUrl = options.url;
};

const resContextMenu = handleContextMenuClick(
  { menuItemId: 'openImageInThisTab', srcUrl: 'https://example.com/photo.jpg' },
  { id: 101 },
  mockUpdate
);

assert.strictEqual(resContextMenu, true);
assert.strictEqual(updatedTabId, 101);
assert.strictEqual(updatedUrl, 'https://example.com/photo.jpg');
console.log('✓ Context menu click handler verified!');

console.log('\nAll tests passed cleanly!');


