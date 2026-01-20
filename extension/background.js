// ShopMentor AI Background Service Worker
// Step 4: Logic with external server (secure API key storage)

// Server configuration
// Production server URL on Render
const SERVER_URL = 'https://shopmentor-server-api.onrender.com';

// Log message to verify script loaded
console.log('ShopMentor AI: Background worker loaded');
console.log('ShopMentor AI: Server URL:', SERVER_URL);

// Function to detect browser language
function detectBrowserLanguage() {
  // Try to get from navigator.language (browser language)
  const browserLang = navigator.language || navigator.userLanguage || 'en';
  const langCode = browserLang.split('-')[0].toLowerCase();
  
  // Map browser language codes to our supported languages
  const langMap = {
    'he': 'he', 'iw': 'he', // Hebrew
    'en': 'en', // English
    'ar': 'ar', // Arabic
    'ru': 'ru', // Russian
    'es': 'es', // Spanish
    'fr': 'fr', // French
    'de': 'de'  // German
  };
  
  return langMap[langCode] || 'en'; // Default to English if not supported
}

// Current language (will be loaded from storage)
let currentLanguage = 'he';

// Loading language from storage
chrome.storage.sync.get(['shopmentor_language'], (result) => {
  currentLanguage = result.shopmentor_language || detectBrowserLanguage();
  
  // If no language was saved, save the detected one
  if (!result.shopmentor_language) {
    chrome.storage.sync.set({ shopmentor_language: currentLanguage });
  }
});

// Updating language when it changes
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'sync' && changes.shopmentor_language) {
    currentLanguage = changes.shopmentor_language.newValue || 'he';
    console.log('ShopMentor AI: Language changed to:', currentLanguage);
  }
});

// Listening to messages from content scripts or popup
// chrome.runtime.onMessage - Chrome API for listening to messages
// request - the data sent
// sender - who sent the message (tab, extension, etc.)
// sendResponse - function to send response
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  
  // Checking which action was requested
  // request.action - type of action (e.g., 'checkPrice', 'getConfig', etc.)
  if (request.action === 'checkPrice') {
    
    // Calling function to handle price check request
    // productData - product data (title, price, imageUrl)
    handlePriceCheck(request.productData, sendResponse);
    
    // return true tells Chrome that we'll send response asynchronously
    // This is important because handlePriceCheck is an async function
    return true;
  }
  
  // If it's not a recognized action, return false
  // false = no response sent
  return false;
});

// ---------- Browser Agent helpers (tabs + scripting) ----------
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function waitForTabComplete(tabId, timeoutMs = 20000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();

    function onUpdated(updatedTabId, info) {
      if (updatedTabId !== tabId) return;
      if (info.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(onUpdated);
        resolve();
      }
    }

    chrome.tabs.onUpdated.addListener(onUpdated);

    (async () => {
      while (Date.now() - start < timeoutMs) {
        const tab = await chrome.tabs.get(tabId);
        if (tab?.status === 'complete') {
          chrome.tabs.onUpdated.removeListener(onUpdated);
          resolve();
          return;
        }
        await sleep(250);
      }
      chrome.tabs.onUpdated.removeListener(onUpdated);
      reject(new Error('Timeout waiting for tab to complete'));
    })().catch((e) => {
      chrome.tabs.onUpdated.removeListener(onUpdated);
      reject(e);
    });
  });
}

async function withHiddenTab(url, fn, { timeoutMs = 25000 } = {}) {
  const tab = await chrome.tabs.create({ url, active: false });
  try {
    await waitForTabComplete(tab.id, timeoutMs);
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: fn
    });
    return result;
  } finally {
    try {
      await chrome.tabs.remove(tab.id);
    } catch (_) {
      // ignore
    }
  }
}

function buildRequiredTokens(productData) {
  const tokens = new Set();
  const src = [productData.title, ...(productData.features || [])]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  // numbers + units (hard specs)
  const unitMatches =
    src.match(
      /\b\d+(\.\d+)?\s?(gb|tb|mb|mhz|ghz|w|mm|cm|inch|in|usb-?c|usb|hdmi|sd|microsd|uhs-?i|uhs-?ii)\b/g
    ) || [];
  unitMatches.forEach((t) => tokens.add(t.replace(/\s+/g, '')));

  // "model-like" tokens (letters+digits) length>=4
  const modelMatches = src.match(/\b[a-z]{1,6}\d[a-z0-9-]{2,}\b/g) || [];
  modelMatches.forEach((t) => tokens.add(t));

  // best-effort brand token from title first word
  const title = (productData.title || '').trim();
  const brand = title.split(/\s+/).slice(0, 1)[0];
  if (brand && brand.length >= 3) tokens.add(brand.toLowerCase());

  return Array.from(tokens).slice(0, 10);
}

function scoreTitle(title, requiredTokens) {
  const t = (title || '').toLowerCase();
  let score = 0;
  for (const tok of requiredTokens) {
    if (!tok) continue;
    if (t.includes(tok.toLowerCase())) score += 1;
  }
  return score;
}

function extractAmazonAsinFromUrl(url) {
  const m = String(url || '').match(/\/dp\/([A-Z0-9]{10})(?:[\/?]|$)/i);
  return m ? m[1].toUpperCase() : '';
}

function extractAliItemIdFromUrl(url) {
  const m = String(url || '').match(/\/item\/(\d+)\.html/i);
  return m ? m[1] : '';
}

function getHost(url) {
  try {
    return new URL(url).host;
  } catch (_) {
    return '';
  }
}

async function scrapeAmazonOfferListing(amazonHost, asin) {
  if (!amazonHost || !asin) return null;
  const url = `https://${amazonHost}/gp/offer-listing/${asin}`;
  return await withHiddenTab(
    url,
    () => {
      function parsePrice(text) {
        const m = (text || '').replace(/\s+/g, ' ').match(/(\d[\d,]*\.?\d*)/);
        if (!m) return 0;
        return parseFloat(m[1].replace(/,/g, '')) || 0;
      }
      const prices = [];
      const priceEls = document.querySelectorAll('.a-price .a-offscreen, .olpOfferPrice, span.a-price .a-offscreen');
      priceEls.forEach((el) => {
        const v = parsePrice(el.textContent);
        if (v > 0) prices.push(v);
      });
      const minPrice = prices.length ? Math.min(...prices) : 0;
      return { url: window.location.href, price: minPrice ? String(minPrice.toFixed(2)) : '' };
    },
    { timeoutMs: 30000 }
  );
}

async function scrapeAmazonSearchTop(amazonHost, query) {
  const url = `https://${amazonHost}/s?k=${encodeURIComponent(query)}`;
  return await withHiddenTab(
    url,
    () => {
      const results = [];
      const items = document.querySelectorAll('div[data-component-type="s-search-result"]');
      items.forEach((item) => {
        const a = item.querySelector('h2 a[href]');
        const title = a ? (a.textContent || '').trim() : '';
        const href = a ? a.getAttribute('href') : '';
        if (!title || !href) return;
        const abs = new URL(href, window.location.origin).toString();
        results.push({ title, url: abs });
      });
      return results.slice(0, 10);
    },
    { timeoutMs: 30000 }
  );
}

async function scrapeAliSearchTop(query) {
  const url = `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(query)}`;
  return await withHiddenTab(
    url,
    () => {
      const results = [];
      const links = Array.from(document.querySelectorAll('a[href*="/item/"]')).slice(0, 60);
      for (const a of links) {
        const href = a.getAttribute('href') || '';
        if (!href) continue;
        const abs = new URL(href, window.location.origin).toString();
        const idMatch = abs.match(/\/item\/(\d+)\.html/i);
        if (!idMatch) continue;
        const title = (a.textContent || '').replace(/\s+/g, ' ').trim();
        results.push({ title, url: abs });
        if (results.length >= 12) break;
      }
      const seen = new Set();
      return results.filter((r) => (seen.has(r.url) ? false : (seen.add(r.url), true))).slice(0, 10);
    },
    { timeoutMs: 35000 }
  );
}

async function scrapeAmazonProductPrice(url) {
  return await withHiddenTab(
    url,
    () => {
      function parsePrice(text) {
        const m = (text || '').replace(/\s+/g, ' ').match(/(\d[\d,]*\.?\d*)/);
        if (!m) return 0;
        return parseFloat(m[1].replace(/,/g, '')) || 0;
      }
      const selectors = [
        '#corePrice_feature_div .a-price .a-offscreen',
        '#priceblock_ourprice',
        '#priceblock_dealprice',
        '.a-price .a-offscreen',
        'span.a-price .a-offscreen'
      ];
      let price = 0;
      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (!el) continue;
        price = parsePrice(el.textContent);
        if (price > 0) break;
      }
      const asinMatch = window.location.href.match(/\/dp\/([A-Z0-9]{10})(?:[\/?]|$)/i);
      const asin = asinMatch ? asinMatch[1].toUpperCase() : '';
      const title = (document.querySelector('#productTitle')?.textContent || '').trim();
      return { url: window.location.href, price: price ? String(price.toFixed(2)) : '', asin, title };
    },
    { timeoutMs: 30000 }
  );
}

async function scrapeAliProductPrice(url) {
  return await withHiddenTab(
    url,
    () => {
      function parsePrice(text) {
        const m = (text || '').replace(/\s+/g, ' ').match(/(\d[\d,]*\.?\d*)/);
        if (!m) return 0;
        return parseFloat(m[1].replace(/,/g, '')) || 0;
      }
      const selectors = ['.product-price-value', '[itemprop="price"]', '.notranslate.price', '.price-current'];
      let price = 0;
      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (!el) continue;
        price = parsePrice(el.textContent || el.getAttribute('content'));
        if (price > 0) break;
      }
      const idMatch = window.location.href.match(/\/item\/(\d+)\.html/i);
      const itemId = idMatch ? idMatch[1] : '';
      const title =
        (document.querySelector('h1.product-title-text')?.textContent ||
          document.querySelector('.product-title-text')?.textContent ||
          document.querySelector('h1[itemprop="name"]')?.textContent ||
          '').trim();
      return { url: window.location.href, price: price ? String(price.toFixed(2)) : '', itemId, title };
    },
    { timeoutMs: 35000 }
  );
}

// Function to handle price check request
// async function - asynchronous function (can use await)
// productData - object with: { title, price, imageUrl, site }
// sendResponse - function to send response back
async function handlePriceCheck(productData, sendResponse) {
  // Free usage configuration
  const FREE_USES = 5;

  // Validity check - is there a valid price?
  // parseFloat - converts string to number
  // || 0 - if parseFloat fails, use 0
  const priceStr = String(productData.price || '').trim();
  const originalPrice = parseFloat(priceStr) || 0;

  // If price is not valid (0 or negative), return error with more details
  if (originalPrice <= 0 || isNaN(originalPrice)) {
    sendResponse({
      success: false,
      error: 'Invalid price',
      details: `Price value: "${productData.price}" could not be parsed as a valid number`
    });
    return; // Exit function
  }

  // Load local usage state (how many free uses and whether user has paid)
  let usageCount = 0;
  let hasPaid = false;

  try {
    const stored = await new Promise((resolve) => {
      chrome.storage.sync.get(
        ['shopmentor_usageCount', 'shopmentor_hasPaid'],
        (result) => resolve(result || {})
      );
    });
    usageCount = Number(stored.shopmentor_usageCount || 0);
    hasPaid = Boolean(stored.shopmentor_hasPaid);
  } catch (e) {
    // If storage access fails, fall back to zero usage and not paid
    usageCount = 0;
    hasPaid = false;
  }

  const usageInfo = {
    used: usageCount,
    freeLimit: FREE_USES,
    remainingFreeUses: Math.max(0, FREE_USES - usageCount)
  };

  // This will hold the usage info we return after a successful analysis
  // (we only increment the counter when we actually have a result)
  let updatedUsageInfo = { ...usageInfo };

  // If user has not paid and exceeded free limit, block and ask for payment
  if (!hasPaid && usageCount >= FREE_USES) {
    sendResponse({
      success: false,
      error: 'payment_required',
      details: 'Free usage limit reached. Please upgrade to continue.',
      usage: {
        used: usageInfo.used,
        freeLimit: usageInfo.freeLimit,
        remainingFreeUses: 0
      }
    });
    return;
  }

  // Call external server for analysis
  try {
    console.log('📤 ShopMentor AI: Sending request to server...');
    console.log('📤 ShopMentor AI: Language:', currentLanguage);
    console.log('📤 ShopMentor AI: Currency:', productData.currency || 'ILS');
    console.log('📤 ShopMentor AI: Server URL:', SERVER_URL);
    console.log('📤 ShopMentor AI: Full productData:', JSON.stringify(productData, null, 2));
    
    // Add timeout to prevent hanging requests (30 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const requestBody = {
      productData: productData,
      language: currentLanguage,
      currency: productData.currency || 'ILS' // Send currency to server
    };
    
    console.log('📤 ShopMentor AI: Request body:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(`${SERVER_URL}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    console.log('📥 ShopMentor AI: Server response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ ShopMentor AI: Server error response:', errorText);
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { error: errorText || 'Unknown error' };
      }
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }

    const result = await response.json();
    console.log('📥 ShopMentor AI: Server response data:', result);

    if (result.success) {
      // Only now, after we have a successful result, increment free-usage counter (if user has not paid)
      if (!hasPaid) {
        const newCount = usageCount + 1;
        updatedUsageInfo = {
          used: newCount,
          freeLimit: FREE_USES,
          remainingFreeUses: Math.max(0, FREE_USES - newCount)
        };
        chrome.storage.sync.set({ shopmentor_usageCount: newCount });
      }

      // Include currency and usage info in response
      result.currency = productData.currency || 'ILS';
      result.usage = updatedUsageInfo;
      sendResponse(result);
      return;
    } else {
      throw new Error(result.error || 'Server returned unsuccessful response');
    }
  } catch (error) {
    
    // Check if it's a timeout
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      sendResponse({
        success: false,
        error: 'Request timed out',
        details: 'Server did not respond within 30 seconds'
      });
      return;
    } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      sendResponse({
        success: false,
        error: 'Network error',
        details: 'Could not reach server. Please check your internet connection.'
      });
      return;
    }
  }

  // If server didn't work, use fallback that returns basic advice structure

  const searchQuery = encodeURIComponent((productData.title || '').slice(0, 100));
  const fallbackAdvice = {
    productOverview: {
      description: 'Unable to provide overview at this time. Server may be unavailable.',
      targetAudience: 'Unknown',
      category: 'Unknown',
      mainFeatures: []
    },
    buyingAdvice: {
      isGoodTimeToBuy: 'maybe',
      recommendation: 'Unable to analyze at this time - please check manually or try again later.',
      priceAssessment: 'Unknown',
      waitForSale: false,
      nextSaleDate: 'Unknown',
      expectedSalePrice: 'Unknown'
    },
    competitors: [],
    bestBrand: {},
    aliexpressAlternative: {
      available: false,
      recommendation: 'Unable to analyze'
    },
    newModelTiming: {
      expectedSoon: false,
      shouldWait: false,
      reasoning: 'Unable to analyze'
    }
  };

  sendResponse({
    success: true,
    originalPrice: originalPrice.toFixed(2),
    currency: productData.currency || 'ILS', // Include currency in fallback response
    // For fallback (server error/timeout), we DO NOT increment usage counter,
    // so we return the current usage info as-is.
    usage: usageInfo,
    salesAdvice: fallbackAdvice,
    productData: productData,
    source: 'Fallback (Server unavailable)'
  });
}

// Listening to installation event
// This runs once when extension is installed or updated
chrome.runtime.onInstalled.addListener(() => {
  console.log('ShopMentor AI: Extension installed/updated');
});
