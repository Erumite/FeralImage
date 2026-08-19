/**
 * FeralImages Background Service Worker
 * Programmatically injects content script & CSS into top-level data:image/... URIs
 * handling all navigation lifecycle events in Chromium browsers.
 */

function injectViewer(tabId, tabUrl) {
  if (!tabId) return;

  if (!tabUrl) {
    chrome.tabs.get(tabId, (tab) => {
      if (chrome.runtime.lastError || !tab) return;
      doInject(tabId, tab.url);
    });
  } else {
    doInject(tabId, tabUrl);
  }
}

function doInject(tabId, url) {
  if (!url) return;
  const lowerUrl = url.toLowerCase();

  if (lowerUrl.startsWith('data:image/') || lowerUrl.startsWith('data:image;')) {
    chrome.scripting.insertCSS({
      target: { tabId: tabId },
      files: ['styles.css']
    }).catch(() => {});

    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content.js']
    }).catch(() => {});
  }
}

// 1. Navigation lifecycle listeners
if (chrome.webNavigation) {
  chrome.webNavigation.onCommitted.addListener((details) => {
    if (details.tabId) {
      injectViewer(details.tabId, details.url);
    }
  });

  chrome.webNavigation.onDOMContentLoaded.addListener((details) => {
    if (details.tabId) {
      injectViewer(details.tabId, details.url);
    }
  });
}

// 2. Tab updates & active tab listeners
if (chrome.tabs) {
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url || changeInfo.status === 'loading') {
      injectViewer(tabId, changeInfo.url || tab.url);
    }
  });

  chrome.tabs.onActivated.addListener((activeInfo) => {
    injectViewer(activeInfo.tabId, null);
  });
}
