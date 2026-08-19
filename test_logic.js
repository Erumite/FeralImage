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

console.log('\nAll tests passed cleanly!');
