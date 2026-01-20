// ShopMentor AI Popup Script
// Popup: language selection + small usage counter (free uses)

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

document.addEventListener('DOMContentLoaded', () => {
  const FREE_USES = 5;
  // Loading saved language, or detect from browser if not set
  chrome.storage.sync.get(['shopmentor_language'], (result) => {
    const savedLanguage = result.shopmentor_language || detectBrowserLanguage();
    const languageSelect = document.getElementById('language-select');
    if (languageSelect) {
      languageSelect.value = savedLanguage;
      updateLanguageStatus(savedLanguage);
      
      // If no language was saved, save the detected one
      if (!result.shopmentor_language) {
        chrome.storage.sync.set({ shopmentor_language: savedLanguage });
      }
    }
  });
  
  // Saving language when changed
  const languageSelect = document.getElementById('language-select');
  if (languageSelect) {
    languageSelect.addEventListener('change', (e) => {
      const selectedLanguage = e.target.value;
      chrome.storage.sync.set({ shopmentor_language: selectedLanguage }, () => {
        updateLanguageStatus(selectedLanguage);
      });
    });
  }
  
  // Checking site
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentTab = tabs[0];
    if (currentTab) {
      const hostname = new URL(currentTab.url).hostname.toLowerCase();
      const isSupported = hostname.includes('amazon') || hostname.includes('aliexpress') || 
                         hostname.includes('ksp') || hostname.includes('ebay');
      
      const statusEl = document.getElementById('site-status');
      if (isSupported) {
        statusEl.textContent = 'Site supported ✓';
      } else {
        statusEl.textContent = 'Site not supported';
      }
    }
  });

  // Show free-usage counter (small, gray) in header
  chrome.storage.sync.get(['shopmentor_usageCount', 'shopmentor_hasPaid'], (result) => {
    const usageEl = document.getElementById('usage-badge');
    if (!usageEl) return;

    const used = Number(result.shopmentor_usageCount || 0);
    const hasPaid = Boolean(result.shopmentor_hasPaid);

    if (hasPaid) {
      usageEl.textContent = 'Unlimited (paid)';
    } else {
      const remaining = Math.max(0, FREE_USES - used);
      usageEl.textContent = `חינמי: ${remaining}/${FREE_USES}`;
    }
  });
});

function updateLanguageStatus(language) {
  const statusEl = document.getElementById('language-status');
  if (statusEl) {
    const languageNames = {
      'he': 'עברית',
      'en': 'English',
      'ar': 'العربية',
      'ru': 'Русский',
      'es': 'Español',
      'fr': 'Français',
      'de': 'Deutsch'
    };
    statusEl.textContent = `Selected language: ${languageNames[language] || language}`;
  }
}
