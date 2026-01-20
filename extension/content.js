// ShopMentor AI Content Script
// Content script that handles hover detection, data extraction, and UI display

(function() {
  'use strict';

  // Settings
  // HOVER_DEBOUNCE_MS - how long to wait before showing overlay (500ms)
  // This prevents accidental overlay display when moving mouse quickly
  const HOVER_DEBOUNCE_MS = 500;

  // Function to detect browser/website language
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

  // Current language (will be loaded from storage or detected from browser)
  // Detect from browser as default, then load from storage
  let currentLanguage = detectBrowserLanguage();

  // Loading language from storage (async, will update when loaded)
  chrome.storage.sync.get(['shopmentor_language'], (result) => {
    if (result.shopmentor_language) {
      currentLanguage = result.shopmentor_language;
    } else {
      // If no language in storage, use detected browser language and save it
      const detectedLang = detectBrowserLanguage();
      currentLanguage = detectedLang;
      chrome.storage.sync.set({ shopmentor_language: detectedLang });
    }
  });

  // Listening to language changes
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'sync' && changes.shopmentor_language) {
      currentLanguage = changes.shopmentor_language.newValue || 'he';
    }
  });

  // Language strings
  const languageStrings = {
    he: {
      analyzing: 'מנתח מוצר ונותן עצות קנייה...',
      productOverview: 'סקירה כללית',
      buyingAdvice: 'עצת קנייה',
      competitors: 'מתחרים',
      bestProduct: 'המוצר הטוב ביותר בקטגוריה',
      aliexpressAlternative: 'חלופה סינית באליאקספרס',
      newModel: 'דגם חדש',
      targetAudience: 'קהל יעד',
      category: 'קטגוריה',
      mainFeatures: 'תכונות עיקריות',
      priceAssessment: 'הערכת מחיר',
      waitForSale: 'כדאי לחכות למבצע',
      expectedSale: 'מבצע צפוי',
      expectedPrice: 'מחיר צפוי במבצע',
      model: 'דגם',
      keyAdvantages: 'יתרונות עיקריים',
      comparison: 'השוואה למוצר הנוכחי',
      quality: 'איכות',
      searchOnAli: 'חפש באליאקספרס',
      searchFor: 'חפש את',
      shouldWait: 'כדאי לחכות לדגם החדש',
      expectedSoon: 'דגם חדש צפוי בקרוב',
      notAvailable: 'לא זמין',
      unknown: 'לא ידוע'
    },
    en: {
      analyzing: 'Analyzing product and providing shopping advice...',
      productOverview: 'Product Overview',
      buyingAdvice: 'Buying Advice',
      competitors: 'Competitors',
      bestProduct: 'Best Product in Category',
      aliexpressAlternative: 'Chinese Alternative on AliExpress',
      newModel: 'New Model',
      targetAudience: 'Target Audience',
      category: 'Category',
      mainFeatures: 'Main Features',
      priceAssessment: 'Price Assessment',
      waitForSale: 'Worth waiting for sale',
      expectedSale: 'Expected Sale',
      expectedPrice: 'Expected Sale Price',
      model: 'Model',
      keyAdvantages: 'Key Advantages',
      comparison: 'Comparison to Current Product',
      quality: 'Quality',
      searchOnAli: 'Search on AliExpress',
      searchFor: 'Search for',
      shouldWait: 'Worth waiting for new model',
      expectedSoon: 'New model expected soon',
      notAvailable: 'Not available',
      unknown: 'Unknown'
    },
    ar: {
      analyzing: 'جارٍ تحليل المنتج وتقديم نصائح التسوق...',
      productOverview: 'نظرة عامة على المنتج',
      buyingAdvice: 'نصيحة الشراء',
      competitors: 'المنافسون',
      bestProduct: 'أفضل منتج في الفئة',
      aliexpressAlternative: 'بديل صيني على AliExpress',
      newModel: 'طراز جديد',
      targetAudience: 'الجمهور المستهدف',
      category: 'الفئة',
      mainFeatures: 'الميزات الرئيسية',
      priceAssessment: 'تقييم السعر',
      waitForSale: 'يستحق الانتظار للبيع',
      expectedSale: 'البيع المتوقع',
      expectedPrice: 'السعر المتوقع في البيع',
      model: 'الطراز',
      keyAdvantages: 'المزايا الرئيسية',
      comparison: 'مقارنة بالمنتج الحالي',
      quality: 'الجودة',
      searchOnAli: 'البحث على AliExpress',
      searchFor: 'ابحث عن',
      shouldWait: 'يستحق الانتظار للطراز الجديد',
      expectedSoon: 'طراز جديد متوقع قريباً',
      notAvailable: 'غير متاح',
      unknown: 'غير معروف'
    },
    ru: {
      analyzing: 'Анализирую продукт и даю советы по покупкам...',
      productOverview: 'Обзор продукта',
      buyingAdvice: 'Совет по покупке',
      competitors: 'Конкуренты',
      bestProduct: 'Лучший продукт в категории',
      aliexpressAlternative: 'Китайская альтернатива на AliExpress',
      newModel: 'Новая модель',
      targetAudience: 'Целевая аудитория',
      category: 'Категория',
      mainFeatures: 'Основные функции',
      priceAssessment: 'Оценка цены',
      waitForSale: 'Стоит подождать распродажи',
      expectedSale: 'Ожидаемая распродажа',
      expectedPrice: 'Ожидаемая цена на распродаже',
      model: 'Модель',
      keyAdvantages: 'Ключевые преимущества',
      comparison: 'Сравнение с текущим продуктом',
      quality: 'Качество',
      searchOnAli: 'Поиск на AliExpress',
      searchFor: 'Поиск',
      shouldWait: 'Стоит подождать новую модель',
      expectedSoon: 'Новая модель ожидается скоро',
      notAvailable: 'Недоступно',
      unknown: 'Неизвестно'
    },
    es: {
      analyzing: 'Analizando producto y proporcionando consejos de compra...',
      productOverview: 'Resumen del Producto',
      buyingAdvice: 'Consejo de Compra',
      competitors: 'Competidores',
      bestProduct: 'Mejor Producto en Categoría',
      aliexpressAlternative: 'Alternativa China en AliExpress',
      newModel: 'Nuevo Modelo',
      targetAudience: 'Audiencia Objetivo',
      category: 'Categoría',
      mainFeatures: 'Características Principales',
      priceAssessment: 'Evaluación de Precio',
      waitForSale: 'Vale la pena esperar la venta',
      expectedSale: 'Venta Esperada',
      expectedPrice: 'Precio Esperado en Venta',
      model: 'Modelo',
      keyAdvantages: 'Ventajas Clave',
      comparison: 'Comparación con Producto Actual',
      quality: 'Calidad',
      searchOnAli: 'Buscar en AliExpress',
      searchFor: 'Buscar',
      shouldWait: 'Vale la pena esperar el nuevo modelo',
      expectedSoon: 'Nuevo modelo esperado pronto',
      notAvailable: 'No disponible',
      unknown: 'Desconocido'
    },
    fr: {
      analyzing: 'Analyse du produit et fourniture de conseils d\'achat...',
      productOverview: 'Aperçu du Produit',
      buyingAdvice: 'Conseil d\'Achat',
      competitors: 'Concurrents',
      bestProduct: 'Meilleur Produit dans la Catégorie',
      aliexpressAlternative: 'Alternative Chinoise sur AliExpress',
      newModel: 'Nouveau Modèle',
      targetAudience: 'Public Cible',
      category: 'Catégorie',
      mainFeatures: 'Caractéristiques Principales',
      priceAssessment: 'Évaluation du Prix',
      waitForSale: 'Vaut la peine d\'attendre la vente',
      expectedSale: 'Vente Attendue',
      expectedPrice: 'Prix Attendu en Vente',
      model: 'Modèle',
      keyAdvantages: 'Avantages Clés',
      comparison: 'Comparaison avec le Produit Actuel',
      quality: 'Qualité',
      searchOnAli: 'Rechercher sur AliExpress',
      searchFor: 'Rechercher',
      shouldWait: 'Vaut la peine d\'attendre le nouveau modèle',
      expectedSoon: 'Nouveau modèle attendu bientôt',
      notAvailable: 'Non disponible',
      unknown: 'Inconnu'
    },
    de: {
      analyzing: 'Produkt analysieren und Einkaufsberatung geben...',
      productOverview: 'Produktübersicht',
      buyingAdvice: 'Kaufberatung',
      competitors: 'Wettbewerber',
      bestProduct: 'Bestes Produkt in der Kategorie',
      aliexpressAlternative: 'Chinesische Alternative auf AliExpress',
      newModel: 'Neues Modell',
      targetAudience: 'Zielgruppe',
      category: 'Kategorie',
      mainFeatures: 'Hauptmerkmale',
      priceAssessment: 'Preisbewertung',
      waitForSale: 'Lohnt sich, auf den Verkauf zu warten',
      expectedSale: 'Erwarteter Verkauf',
      expectedPrice: 'Erwarteter Verkaufspreis',
      model: 'Modell',
      keyAdvantages: 'Hauptvorteile',
      comparison: 'Vergleich mit aktuellem Produkt',
      quality: 'Qualität',
      searchOnAli: 'Auf AliExpress suchen',
      searchFor: 'Suchen nach',
      shouldWait: 'Lohnt sich, auf das neue Modell zu warten',
      expectedSoon: 'Neues Modell erwartet bald',
      notAvailable: 'Nicht verfügbar',
      unknown: 'Unbekannt'
    }
  };

  // Function to get localized string
  function getString(key) {
    const strings = languageStrings[currentLanguage] || languageStrings['en'];
    return strings[key] || languageStrings['en'][key] || '';
  }

  // Settings for each site
  // SITE_CONFIG - object containing selectors for each site
  // selectors - how to find elements on page (like CSS selectors)
  const SITE_CONFIG = {
    amazon: {
      // Add to Cart / Buy Now / Add to List buttons
      buttonSelectors: [
        '#add-to-cart-button',
        '#buy-now-button',
        '[name="submit.add-to-cart"]',
        '[data-action="add-to-cart"]',
        'input[aria-labelledby="submit.add-to-cart-announce"]',
        'input[value="Add to Cart"]',
        'input[value="Buy Now"]',
        'button[aria-labelledby*="add-to-cart"]',
        // Add to List / Wishlist
        '#add-to-wishlist-button',
        '[data-action="add-to-wishlist"]',
        'button[aria-labelledby*="add-to-wishlist"]',
        '[aria-label*="Add to List"]',
        '[aria-label*="add to list"]',
        'button[aria-label*="wishlist"]',
        'button[aria-label*="Wishlist"]',
        // Search pages - each product card
        'div[data-component-type="s-search-result"]',
        '[data-asin] h2 a',
        '.s-result-item'
      ],
      // Product name
      titleSelectors: [
        '#productTitle',
        'h1.a-size-large',
        'h1#title',
        'span#productTitle'
      ],
      // Price
      priceSelectors: [
        '.a-price-whole',
        '.a-price .a-offscreen',
        '#priceblock_ourprice',
        '#priceblock_dealprice',
        '.a-price-now',
        'span.a-price'
      ],
      // Image
      imageSelectors: [
        '#landingImage',
        '#imgBlkFront',
        '#main-image',
        '.a-dynamic-image',
        'img[data-a-image-name="landingImage"]'
      ]
    },
    ebay: {
      // Add to Cart / Buy It Now buttons
      buttonSelectors: [
        '#atcBtn',
        '#binBtn',
        '[data-testid="ux-call-to-action"]',
        'button[data-testid="ux-call-to-action"]',
        'a[data-testid="ux-call-to-action"]',
        '.ux-call-to-action',
        'button[class*="btn"]',
        'a[class*="btn"]',
        '[data-testid="ux-call-to-action-secondary"]',
        // Buy It Now
        '[data-testid="binBtn"]',
        '[data-testid="atcBtn"]',
        // Watch / Add to Cart
        '[data-testid="watchBtn"]',
        '[data-testid="addToCartBtn"]',
        // Search pages - product cards
        '.s-item',
        '[data-testid="s-item"]'
      ],
      // Product name
      titleSelectors: [
        'h1[data-testid="x-item-title-label"]',
        'h1[id*="itemTitle"]',
        'h1.itemTitle',
        'h1[class*="item-title"]',
        'h1[class*="ItemTitle"]',
        '#ebay-item-title',
        'h1'
      ],
      // Price
      priceSelectors: [
        '[data-testid="x-price-primary"]',
        '.notranslate',
        '[itemprop="price"]',
        '.u-flL.condText',
        '.notranslate[itemprop="price"]',
        '[class*="price"]',
        '[id*="price"]'
      ],
      // Image
      imageSelectors: [
        '#icImg',
        '[data-testid="ux-image-carousel-item"] img',
        '.ux-image-carousel-item img',
        '[id*="icImg"]',
        'img[itemprop="image"]',
        '.img.imgWr2 img'
      ]
    },
    aliexpress: {
      // Add to Cart / Buy Now buttons
      buttonSelectors: [
        '.addcart-btn',
        '.buynow-btn',
        '[data-role="addToCart"]',
        'button[data-role="addToCart"]',
        '.product-quantity-tip + button',
        'button.add-to-cart',
        'button.buy-now',
        '.product-action button',
        'button[class*="add"]',
        'button[class*="cart"]',
        // Additional common selectors for AliExpress
        'button[class*="AddToCart"]',
        'button[class*="BuyNow"]',
        '[class*="add-to-cart"]',
        '[class*="buy-now"]',
        '.pdp-action-button',
        '.product-action-btn',
        'button[aria-label*="cart"]',
        'button[aria-label*="Cart"]',
        'button[aria-label*="buy"]',
        'button[aria-label*="Buy"]',
        '[data-spm*="add"]',
        '[data-spm*="cart"]',
        '[data-spm*="buy"]'
      ],
      // Product name
      titleSelectors: [
        'h1.product-title-text',
        '.product-title-text',
        'h1[itemprop="name"]',
        'h1[data-pl="product-title"]',
        '[data-pl="product-title"]',
        'h1.pdp-product-name',
        '.pdp-product-name',
        'h1[class*="title"]',
        '[class*="product-title"]',
        '[class*="productTitle"]',
        'h1'
      ],
      // Price
      priceSelectors: [
        '.product-price-value',
        '.price-current',
        '[itemprop="price"]',
        '.notranslate.price',
        '[data-pl="product-price"]',
        '.pdp-price',
        '[class*="price-current"]',
        '[class*="price-value"]',
        '[class*="product-price"]',
        '.price',
        '[class*="price"]'
      ],
      // Image
      imageSelectors: [
        '.images-view-item img',
        '.magnifier-image',
        '#j-image-thumb-wrap img',
        '.product-image img'
      ]
    },
    generic: {
      // General selectors for any shopping site (including KSP)
      buttonSelectors: [
        'button[class*="cart"]',
        'button[class*="Cart"]',
        'button[class*="buy"]',
        'button[class*="Buy"]',
        'button[class*="add"]',
        'button[class*="Add"]',
        '[class*="add-to-cart"]',
        '[class*="AddToCart"]',
        'a[class*="cart"]',
        'a[class*="buy"]',
        '[data-action*="cart"]',
        '[data-action*="buy"]',
        '[aria-label*="cart"]',
        '[aria-label*="Cart"]',
        '[aria-label*="buy"]',
        '[aria-label*="Buy"]',
        // KSP specific - title attributes
        '[title*="הוסף לעגלה"]',
        '[title*="הוספה לעגלה"]',
        '[title*="הוסף לסל"]',
        // KSP - all buttons with type="button"
        'button[type="button"]',
        'button[type="submit"]'
      ],
      titleSelectors: [
        'h1',
        '[itemprop="name"]',
        '[class*="product-title"]',
        '[class*="productTitle"]',
        '[class*="product-name"]',
        '.product-name',
        'h1[class*="title"]',
        '[id*="title"]',
        // KSP specific
        '[class*="product"] h2',
        '[class*="product"] h3',
        '[class*="item"] h2',
        '[class*="item"] h3'
      ],
      priceSelectors: [
        '[itemprop="price"]',
        '[class*="price"]',
        '[class*="Price"]',
        '.price',
        '[data-price]',
        '[id*="price"]',
        'div[class*="cost"]',
        'div[class*="Cost"]',
        '[class*="amount"]',
        '[class*="Amount"]'
      ],
      imageSelectors: [
        'img[class*="product"]',
        'img[class*="Product"]',
        '[itemprop="image"] img',
        '.product-image img',
        '[class*="main-image"] img',
        'img[class*="main"]'
      ]
    }
  };

  // List of shopping sites we don't support
  const EXCLUDED_SITES = [
    'super-pharm.co.il', 'shufersal.co.il', 'ramilevy.co.il', 'victory.co.il',
    'google.com', 'facebook.com', 'youtube.com', 'twitter.com', 'instagram.com'
  ];
  
  // Supported shopping sites (for competitor search links)
  // Set SUPPORT_ALL_SITES to false to only support specific sites
  const SUPPORT_ALL_SITES = true; // Change to false to only support specific sites
  const SUPPORTED_SITES = [
    'amazon', 'aliexpress', 'ebay', 'ksp', 'shopify'
  ];
  
  // Site detection
  // detectSite - function that identifies which site we're on
  function detectSite() {
    const hostname = window.location.hostname.toLowerCase();
    
    // Check if it's an excluded site
    for (const excluded of EXCLUDED_SITES) {
      if (hostname.includes(excluded)) {
        return null;
      }
    }
    
    // Specific sites with custom config
    if (hostname.includes('amazon')) {
      return 'amazon';
    } else if (hostname.includes('aliexpress')) {
      return 'aliexpress';
    } else if (hostname.includes('ebay')) {
      return 'ebay';
    } else if (hostname.includes('ksp')) {
      // KSP - Israeli shopping site - always supported
      return 'generic';
    }
    
    // Check if we should support all sites or only specific ones
    // If SUPPORT_ALL_SITES is false, only support known shopping sites
    if (!SUPPORT_ALL_SITES) {
      const isSupported = SUPPORTED_SITES.some(site => hostname.includes(site));
      if (!isSupported) {
        return null;
      }
    }
    
    // For any other site - use generic selectors
    // Check if it looks like a product page (has price and product name)
    // Use try-catch to prevent errors if querySelector fails
    try {
      // Price selectors - including KSP (price with ₪)
      const hasPrice = document.querySelector('[itemprop="price"], .price, [class*="price"], [class*="Price"], [data-price], [id*="price"], [class*="cost"], [class*="Cost"]');
      
      // Product name selectors - including KSP
      const hasTitle = document.querySelector('h1, h2, h3, [itemprop="name"], [class*="product-title"], [class*="productTitle"], [class*="product-name"], .product-name, h1[class*="title"], [id*="title"], [class*="item"] h2, [class*="item"] h3, [class*="product"] h2, [class*="product"] h3');
      
      // Button selectors - including KSP
      const hasButton = document.querySelector('button[class*="cart"], button[class*="buy"], button[class*="add"], [class*="add-to-cart"], [aria-label*="cart"], [aria-label*="buy"], button[type="button"]');
      
      // Additional check for KSP - if there are buttons with SVG or price with ₪
      const hasKspPrice = document.body.innerText.includes('₪') || document.body.textContent.includes('₪');
      // Check if there are buttons with SVG (cart icon)
      const allButtons = document.querySelectorAll('button, div, a');
      let hasKspButton = false;
      for (const btn of allButtons) {
        if (btn.querySelector('svg') !== null) {
          hasKspButton = true;
          break;
        }
      }
      
      // If at least 2 out of 3 (price, name, button) - it's probably a product page
      // Or if there's a price with ₪ and it's KSP - it's probably a product page
      const indicatorsCount = (hasPrice ? 1 : 0) + (hasTitle ? 1 : 0) + (hasButton ? 1 : 0);
      const kspIndicators = (hasKspPrice ? 1 : 0) + (hasKspButton ? 1 : 0);
      
      
      if (indicatorsCount >= 2) {
        return 'generic';
      }
      
      // If it's KSP and there's at least a price or button - it's probably a product page
      if (hostname.includes('ksp') && kspIndicators >= 1) {
        return 'generic';
      }
    } catch (e) {
    }
    
    return null;
  }

  // Product data extraction
  // extractProductData - function that extracts name, price and image from page or product card
  function extractProductData(site, hoveredElement = null) {
    // If site === 'generic', use generic config
    let config = SITE_CONFIG[site];
    if (!config && site === 'generic') {
      config = SITE_CONFIG.generic;
    }
    if (!config) {
      return null;
    }
    

    const pageUrl = window.location.href;
    
    // If it's a search page and hover on product card, search inside the card
    const isSearchPage = site === 'amazon' && pageUrl.includes('/s?');
    const isKspPage = site === 'generic' && window.location.hostname.toLowerCase().includes('ksp');
    
    // In KSP, search for the product card that contains the button
    let productCard = null;
    if (isSearchPage && hoveredElement) {
      productCard = hoveredElement.closest('div[data-component-type="s-search-result"]') || 
                    hoveredElement.closest('[data-asin]') ||
                    hoveredElement.closest('.s-result-item');
    } else if (isKspPage && hoveredElement) {
      // KSP - search for the product card (card/item container)
      productCard = hoveredElement.closest('[class*="product"]') ||
                    hoveredElement.closest('[class*="item"]') ||
                    hoveredElement.closest('[class*="card"]') ||
                    hoveredElement.closest('div[class*="Product"]');
    }
    
    // Search scope - if there's a product card, search only inside it
    const searchScope = productCard || document;
    

    // Product identifier to know it's the exact same product on the same site
    // Amazon: ASIN from URL (dp/ASIN) or from data-asin
    // AliExpress: itemId from URL (/item/123456789.html)
    let productId = '';
    let title = null;
    let price = null;
    let imageUrl = null;

    // Currency detection - will be set when price is found
    // Start with a smart default based on site/hostname
    const hostname = window.location.hostname.toLowerCase();
    let currency = 'ILS';
    if (site === 'amazon') {
      if (hostname.includes('amazon.com')) {
        currency = 'USD';
      } else if (hostname.includes('amazon.co.il')) {
        currency = 'ILS';
      }
    }
    
    // Detect site type for currency defaults
    const isEbaySite = site === 'ebay';
    const isKspSite = site === 'generic' && window.location.hostname.toLowerCase().includes('ksp');
    
    // If it's a search page, use different selectors
    if (isSearchPage && productCard) {
      // On search pages, name and price are inside the card
      const titleEl = productCard.querySelector('h2 a span, h2 a, [data-cy="title-recipient"]');
      title = titleEl ? titleEl.textContent.trim() : null;
      
      // Price on search page
      const priceEl = productCard.querySelector('.a-price .a-offscreen, .a-price-whole, .a-price[data-a-size]');
      if (priceEl) {
        const priceText = priceEl.textContent || priceEl.getAttribute('aria-label') || '';
        // Check for currency in price text
        const hasDollar = priceText.includes('$') || priceText.includes('USD') || priceText.includes('US$');
        const hasShekel = priceText.includes('₪') || priceText.includes('ILS') || priceText.includes('NIS');
        
        if (hasDollar) {
          const usdMatch = priceText.match(/\$?\s*([\d,]+\.?\d*)/) || priceText.match(/([\d,]+\.?\d*)\s*\$?/);
          if (usdMatch) {
            price = usdMatch[1].replace(/,/g, '');
            currency = 'USD';
          }
        } else if (hasShekel) {
          const ilsMatch = priceText.match(/₪\s*([\d,]+\.?\d*)/) || priceText.match(/([\d,]+\.?\d*)\s*₪/);
          if (ilsMatch) {
            price = ilsMatch[1].replace(/,/g, '');
            currency = 'ILS';
          }
        } else {
          const priceMatch = priceText.match(/[\d,]+\.?\d*/);
          if (priceMatch) {
            price = priceMatch[0].replace(/,/g, '');
            // Default currency based on site
            currency = (site === 'ebay') ? 'USD' : 'ILS';
          }
        }
      }
      
      // Image on search page
      const imgEl = productCard.querySelector('img[data-image-latency], img.s-image');
      if (imgEl) {
        imageUrl = imgEl.src || imgEl.getAttribute('data-src');
      }
      
      // ASIN from data-asin
      if (productCard.hasAttribute('data-asin')) {
        productId = productCard.getAttribute('data-asin');
      }
    } else {
      // Regular product page - search entire page
      if (site === 'amazon') {
        const m = pageUrl.match(/\/dp\/([A-Z0-9]{10})(?:[\/?]|$)/i);
        productId = m ? m[1].toUpperCase() : '';
      } else if (site === 'aliexpress') {
        const m = pageUrl.match(/\/item\/(\d+)\.html/i);
        productId = m ? m[1] : '';
      } else if (site === 'ebay') {
        // eBay item ID from URL (e.g., /itm/123456789)
        const m = pageUrl.match(/\/itm\/(\d+)/i);
        productId = m ? m[1] : '';
      }
      
      // Extract product name
      for (const selector of config.titleSelectors) {
        const element = searchScope.querySelector(selector);
        if (element) {
          title = element.textContent.trim();
          if (title && title.length > 5) {
            break;
          }
        }
      }
      
      // If no title found, try additional search (AliExpress/KSP)
      if (!title) {
        // General h1 search
        const h1Elements = searchScope.querySelectorAll('h1');
        for (const h1 of h1Elements) {
          const text = h1.textContent.trim();
          if (text && text.length > 5 && text.length < 200) {
            title = text;
            break;
          }
        }
      }
      
      // Extract price
      // In KSP, search for the real price (not deleted) first before generic selectors
      // isKspSite and isEbaySite are already defined above
      
      if (!isKspSite) {
        // For other sites - use generic selectors
        for (const selector of config.priceSelectors) {
          const element = searchScope.querySelector(selector);
          if (element) {
            let priceText = (element.textContent || '').trim();

            // Special handling for Amazon: price split into whole + fraction
            if (site === 'amazon') {
              try {
                // Case 1: selector matched the whole part
                if (element.classList.contains('a-price-whole')) {
                  const whole = (element.textContent || '').replace(/[^\d]/g, '');
                  const fractionEl = element.parentElement
                    ? element.parentElement.querySelector('.a-price-fraction')
                    : null;
                  const fraction = fractionEl
                    ? (fractionEl.textContent || '').replace(/[^\d]/g, '')
                    : '';
                  if (whole) {
                    priceText = fraction ? `${whole}.${fraction}` : whole;
                  }
                }
                // Case 2: selector matched the wrapper span.a-price
                else if (
                  element.matches('span.a-price') ||
                  element.classList.contains('a-price')
                ) {
                  const wholeEl = element.querySelector('.a-price-whole');
                  const fractionEl = element.querySelector('.a-price-fraction');
                  const whole = wholeEl
                    ? (wholeEl.textContent || '').replace(/[^\d]/g, '')
                    : '';
                  const fraction = fractionEl
                    ? (fractionEl.textContent || '').replace(/[^\d]/g, '')
                    : '';
                  if (whole) {
                    priceText = fraction ? `${whole}.${fraction}` : whole;
                  }
                }
              } catch (e) {
                // If anything goes wrong, fall back to original textContent
              }
            }
            
            // Detect currency from price text
            const hasDollar = priceText.includes('$') || priceText.includes('USD') || priceText.includes('US$');
            const hasShekel = priceText.includes('₪') || priceText.includes('ILS') || priceText.includes('NIS');
            
            // For USD prices
            if (hasDollar) {
              const usdMatch = priceText.match(/\$?\s*([\d,]+\.?\d*)/) || priceText.match(/([\d,]+\.?\d*)\s*\$?/);
              if (usdMatch) {
                const usdPrice = parseFloat(usdMatch[1].replace(/,/g, ''));
                price = usdPrice.toString();
                currency = 'USD';
                break;
              }
            }
            
            // For ILS prices (₪)
            if (hasShekel) {
              const ilsMatch = priceText.match(/₪\s*([\d,]+\.?\d*)/) || priceText.match(/([\d,]+\.?\d*)\s*₪/);
              if (ilsMatch) {
                price = ilsMatch[1].replace(/,/g, '');
                currency = 'ILS';
                break;
              }
            }
            
            // Generic price match (no currency symbol - assume ILS for non-eBay sites, USD for eBay)
            // Check if we haven't found a price yet OR if we found a price but no currency
            if (!price || (price && !currency)) {
              const priceMatch = priceText.match(/[\d,]+\.?\d*/);
              if (priceMatch) {
                price = priceMatch[0].replace(/,/g, '');
                // Only set currency if not already set
                if (!currency) {
                  currency = isEbaySite ? 'USD' : 'ILS'; // Default: eBay = USD, others = ILS
                }
                break;
              }
            }
            if (element.getAttribute('aria-label')) {
              const ariaText = element.getAttribute('aria-label');
              const hasDollar = ariaText.includes('$') || ariaText.includes('USD') || ariaText.includes('US$');
              const hasShekel = ariaText.includes('₪') || ariaText.includes('ILS') || ariaText.includes('NIS');
              
              if (hasDollar) {
                const usdMatch = ariaText.match(/\$?\s*([\d,]+\.?\d*)/) || ariaText.match(/([\d,]+\.?\d*)\s*\$?/);
                if (usdMatch) {
                  const usdPrice = parseFloat(usdMatch[1].replace(/,/g, ''));
                  price = usdPrice.toString();
                  currency = 'USD';
                  break;
                }
              }
              if (hasShekel) {
                const ilsMatch = ariaText.match(/₪\s*([\d,]+\.?\d*)/) || ariaText.match(/([\d,]+\.?\d*)\s*₪/);
                if (ilsMatch) {
                  price = ilsMatch[1].replace(/,/g, '');
                  currency = 'ILS';
                  break;
                }
              }
              if (!price) {
                const ariaMatch = ariaText.match(/[\d,]+\.?\d*/);
                if (ariaMatch) {
                  price = ariaMatch[0].replace(/,/g, '');
                  currency = isEbaySite ? 'USD' : 'ILS';
                  break;
                }
              }
            }
            // Also check content attribute (AliExpress/eBay)
            if (element.getAttribute('content')) {
              const contentText = element.getAttribute('content');
              const hasDollar = contentText.includes('$') || contentText.includes('USD') || contentText.includes('US$');
              const hasShekel = contentText.includes('₪') || contentText.includes('ILS') || contentText.includes('NIS');
              
              if (hasDollar) {
                const usdMatch = contentText.match(/\$?\s*([\d,]+\.?\d*)/) || contentText.match(/([\d,]+\.?\d*)\s*\$?/);
                if (usdMatch) {
                  const usdPrice = parseFloat(usdMatch[1].replace(/,/g, ''));
                  price = usdPrice.toString();
                  currency = 'USD';
                  break;
                }
              }
              if (hasShekel) {
                const ilsMatch = contentText.match(/₪\s*([\d,]+\.?\d*)/) || contentText.match(/([\d,]+\.?\d*)\s*₪/);
                if (ilsMatch) {
                  price = ilsMatch[1].replace(/,/g, '');
                  currency = 'ILS';
                  break;
                }
              }
              if (!price) {
                const contentMatch = contentText.match(/[\d,]+\.?\d*/);
                if (contentMatch) {
                  price = contentMatch[0].replace(/,/g, '');
                  currency = isEbaySite ? 'USD' : 'ILS';
                  break;
                }
              }
            }
          }
        }
      }
      
      // If no price found, try additional search (AliExpress/eBay)
      if (!price && site === 'aliexpress') {
        // Search all elements with class containing "price"
        const priceElements = searchScope.querySelectorAll('[class*="price"], [class*="Price"], [id*="price"]');
        for (const el of priceElements) {
          const text = el.textContent || el.getAttribute('content') || '';
          // Search for price - $ or number
          const priceMatch = text.match(/\$?\s*([\d,]+\.?\d*)/) || text.match(/([\d,]+\.?\d*)\s*\$?/);
          if (priceMatch) {
            price = priceMatch[1].replace(/,/g, '');
            break;
          }
        }
      }
      
      // Fallback - search for prices with currency symbols
      if (!price) {
        const priceElements = searchScope.querySelectorAll('[class*="price"], [class*="Price"], [id*="price"], [data-testid*="price"]');
        for (const el of priceElements) {
          const text = el.textContent || el.getAttribute('content') || el.getAttribute('aria-label') || '';
          const hasDollar = text.includes('$') || text.includes('USD') || text.includes('US$');
          const hasShekel = text.includes('₪') || text.includes('ILS') || text.includes('NIS');
          
          if (hasDollar) {
            const usdMatch = text.match(/\$?\s*([\d,]+\.?\d*)/) || text.match(/([\d,]+\.?\d*)\s*\$?/);
            if (usdMatch) {
              const usdPrice = parseFloat(usdMatch[1].replace(/,/g, ''));
              price = usdPrice.toString();
              currency = 'USD';
              break;
            }
          }
          if (hasShekel) {
            const ilsMatch = text.match(/₪\s*([\d,]+\.?\d*)/) || text.match(/([\d,]+\.?\d*)\s*₪/);
            if (ilsMatch) {
              price = ilsMatch[1].replace(/,/g, '');
              currency = 'ILS';
              break;
            }
          }
        }
      }
      
      // KSP - search for real price (first before generic selectors)
      if (isKspSite) {
        
        // KSP - search for the real price (Eilat price or last price, not the deleted price)
        // Collect all prices and select the real price (not deleted)
        const allPriceElements = [];
        const allElements = searchScope.querySelectorAll('*');
        
        for (const el of allElements) {
          const text = el.textContent || '';
          if (text.includes('₪')) {
            // Search for "מחיר אילת" (Eilat price) - this is the real price
            if (text.includes('מחיר אילת') || text.includes('אילת')) {
              const priceMatch = text.match(/₪\s*([\d,]+\.?\d*)/) || text.match(/([\d,]+\.?\d*)\s*₪/);
              if (priceMatch) {
                const foundPrice = priceMatch[1].replace(/,/g, '');
                allPriceElements.push({ price: foundPrice, element: el, isEilat: true, priority: 1, text: text.substring(0, 50) });
              }
            } else {
              // Regular price - check if it's deleted (text-decoration: line-through)
              const style = window.getComputedStyle(el);
              const parentStyle = el.parentElement ? window.getComputedStyle(el.parentElement) : null;
              const isStrikethrough = style.textDecoration.includes('line-through') || 
                                      (parentStyle && parentStyle.textDecoration.includes('line-through')) ||
                                      el.closest('[style*="line-through"]') !== null ||
                                      el.closest('[style*="text-decoration: line-through"]') !== null ||
                                      el.closest('[class*="strike"]') !== null ||
                                      el.closest('[class*="old"]') !== null ||
                                      el.closest('[class*="original"]') !== null ||
                                      el.closest('[class*="crossed"]') !== null ||
                                      el.closest('[class*="deleted"]') !== null;
              
              // Also check by color - deleted prices are usually gray
              const color = style.color || '';
              const isGrayedOut = color.includes('rgb(128') || color.includes('rgb(150') || 
                                   color.includes('rgb(169') || color.includes('gray') ||
                                   color.includes('#808080') || color.includes('#999999');
              
              if (!isStrikethrough && !isGrayedOut) {
                const priceMatch = text.match(/₪\s*([\d,]+\.?\d*)/) || text.match(/([\d,]+\.?\d*)\s*₪/);
                if (priceMatch) {
                  const foundPrice = priceMatch[1].replace(/,/g, '');
                  // Check if it's not the highest price (which is probably the original price)
                  allPriceElements.push({ price: foundPrice, element: el, isEilat: false, priority: 2, text: text.substring(0, 50), isStrikethrough: false });
                }
              } else {
              }
            }
          }
        }
        
        // Price selection - first "מחיר אילת" (Eilat price), otherwise the highest price (main price, not lowest)
        // The lowest price might be a small discount or secondary price - not the main price
        if (allPriceElements.length > 0) {
          // Sort by priority: first Eilat price, otherwise the highest price (main price)
          allPriceElements.sort((a, b) => {
            if (a.isEilat && !b.isEilat) return -1;
            if (!a.isEilat && b.isEilat) return 1;
            // Instead of lowest price, select the highest price (main price)
            return parseFloat(b.price) - parseFloat(a.price);
          });
          
          const selectedPrice = allPriceElements[0].price;
          // Ensure price is a valid number string
          const priceNum = parseFloat(selectedPrice);
          if (!isNaN(priceNum) && priceNum > 0) {
            price = priceNum.toString();
            currency = 'ILS'; // KSP always uses ILS
          } else {
            price = null;
          }
        } else {
        }
      }
      
      // If still no price found in KSP, try generic selectors (only if not KSP)
      if (!price && !isKspSite) {
        // Try generic selectors for other sites
        for (const selector of config.priceSelectors) {
          const element = searchScope.querySelector(selector);
          if (element) {
            const priceText = element.textContent.trim();
            // Check for currency in price text
            const hasDollar = priceText.includes('$') || priceText.includes('USD') || priceText.includes('US$');
            const hasShekel = priceText.includes('₪') || priceText.includes('ILS') || priceText.includes('NIS');
            
            if (hasDollar) {
              const usdMatch = priceText.match(/\$?\s*([\d,]+\.?\d*)/) || priceText.match(/([\d,]+\.?\d*)\s*\$?/);
              if (usdMatch) {
                price = usdMatch[1].replace(/,/g, '');
                currency = 'USD';
                break;
              }
            }
            if (hasShekel) {
              const ilsMatch = priceText.match(/₪\s*([\d,]+\.?\d*)/) || priceText.match(/([\d,]+\.?\d*)\s*₪/);
              if (ilsMatch) {
                price = ilsMatch[1].replace(/,/g, '');
                currency = 'ILS';
                break;
              }
            }
            // Generic price match (no currency symbol)
            if (!price) {
              const priceMatch = priceText.match(/[\d,]+\.?\d*/);
              if (priceMatch) {
                price = priceMatch[0].replace(/,/g, '');
                currency = isEbaySite ? 'USD' : 'ILS'; // Default based on site
                break;
              }
            }
          }
        }
      }
      
      // If still no price found in KSP, try another fallback
      if (!price && isKspSite) {
        // Try to search all elements with class containing "price" but only not deleted
        const kspPriceSelectors = [
          '[class*="price"]',
          '[class*="Price"]',
          '[class*="מחיר"]'
        ];
        
        for (const selector of kspPriceSelectors) {
          try {
            const elements = searchScope.querySelectorAll(selector);
            for (const el of elements) {
              const style = window.getComputedStyle(el);
              const isStrikethrough = style.textDecoration.includes('line-through');
              if (isStrikethrough) continue;
              
              const text = el.textContent || '';
              if (text.includes('₪') && (text.includes('אילת') || !text.includes('מחיר מקורי'))) {
                const priceMatch = text.match(/₪\s*([\d,]+\.?\d*)/) || text.match(/([\d,]+\.?\d*)\s*₪/);
                if (priceMatch) {
                  price = priceMatch[1].replace(/,/g, '');
                  break;
                }
              }
            }
            if (price) break;
          } catch (e) {
            // ignore invalid selectors
          }
        }
      }
      
      // Extract image
      for (const selector of config.imageSelectors) {
        const element = searchScope.querySelector(selector);
        if (element) {
          imageUrl = element.src || element.getAttribute('data-src') || element.getAttribute('data-old-src');
          if (imageUrl && imageUrl.startsWith('http')) {
            break;
          }
        }
      }
    }

    // Validate that there's at least a name and price
    // Validate price is a valid number
    if (price) {
      const priceNum = parseFloat(price);
      if (isNaN(priceNum) || priceNum <= 0) {
        price = null;
      } else {
        // Ensure price is a clean number string
        price = priceNum.toString();
      }
    }
    
    if (!title || !price) {
      return null;
    }
    
    // Ensure currency is set (fallback if not set by any detector)
    if (!currency) {
      if (isEbaySite) {
        currency = 'USD';
      } else if (site === 'amazon') {
        // Default by Amazon domain if we somehow still don't have currency
        const host = window.location.hostname.toLowerCase();
        currency = host.includes('amazon.com') ? 'USD' : 'ILS';
      } else {
        currency = 'ILS';
      }
    }
    
    // Validate price is a valid number (double check)
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      return null;
    }
    

    // Extract features/Specs (for use in search on another site)
    // Try to get bullet points / common specs
    const features = [];
    try {
      if (site === 'amazon') {
        const bulletEls = document.querySelectorAll('#feature-bullets li span, #feature-bullets li');
        bulletEls.forEach((el) => {
          const t = (el.textContent || '').trim();
          if (t && t.length > 3) features.push(t);
        });
        const techSpecEls = document.querySelectorAll('#productDetails_techSpec_section_1 tr, #productDetails_techSpec_section_2 tr');
        techSpecEls.forEach((tr) => {
          const t = (tr.textContent || '').replace(/\s+/g, ' ').trim();
          if (t && t.length > 3) features.push(t);
        });
      } else if (site === 'aliexpress') {
        const specEls = document.querySelectorAll('[class*="spec"] li, [data-pl="product-specs"] li, [data-pl="product-specs"] div');
        specEls.forEach((el) => {
          const t = (el.textContent || '').replace(/\s+/g, ' ').trim();
          if (t && t.length > 3) features.push(t);
        });
      }
    } catch (e) {
      // ignore
    }

    const uniqueFeatures = Array.from(new Set(features)).slice(0, 25);

    // Return product data
    const productData = {
      site,
      pageUrl,
      productId,
      title: title,
      price: price,
      currency: currency, // 'USD' or 'ILS'
      imageUrl: imageUrl || '',
      features: uniqueFeatures
    };
    
    
    return productData;
  }

  // Create UI Overlay
  // createOverlay - function that creates the floating window (overlay)
  let overlayElement = null; // Save the element so we can remove it later

  function createOverlay(productData, position) {
    // If overlay exists, remove it
    if (overlayElement) {
      overlayElement.remove();
      overlayElement = null;
    }

    // Create Shadow DOM
    // Shadow DOM - technology that isolates our CSS from the site's CSS
    // This prevents styling conflicts
    const shadowHost = document.createElement('div');
    shadowHost.id = 'shopmentor-overlay';
    // Add styles directly to shadowHost so it's not transparent
    shadowHost.style.cssText = `
      position: fixed !important;
      z-index: 999999 !important;
      pointer-events: auto !important;
      all: initial;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
    `;
    document.body.appendChild(shadowHost);

    const shadowRoot = shadowHost.attachShadow({ mode: 'open' });

    // Create HTML inside Shadow DOM
    // innerHTML - sets the HTML content of the element
    shadowRoot.innerHTML = `
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        .overlay-container {
          position: fixed;
          z-index: 999999;
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 24px;
          min-width: 380px;
          max-width: 450px;
          max-height: 90vh;
          height: auto;
          overflow-y: auto;
          overflow-x: hidden;
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 
                      0 0 0 1px rgba(255, 255, 255, 0.05);
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          direction: rtl;
          text-align: right;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          display: flex;
          flex-direction: column;
        }
        
        /* Improved scrollbar - looks better */
        .overlay-container::-webkit-scrollbar {
          width: 10px;
        }
        .overlay-container::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          margin: 8px 0;
        }
        .overlay-container::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 10px;
          border: 2px solid rgba(0, 0, 0, 0.1);
        }
        .overlay-container::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
        .overlay-container::-webkit-scrollbar-thumb:active {
          background: rgba(255, 255, 255, 0.7);
        }
        
        /* Scrollbar for Firefox */
        .overlay-container {
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.3) rgba(255, 255, 255, 0.05);
        }
        .header {
          color: #fff;
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 2px solid rgba(74, 222, 128, 0.3);
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .product-info {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 20px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .product-title {
          color: #e2e8f0;
          font-size: 14px;
          line-height: 1.5;
          margin-bottom: 12px;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
        .product-price {
          font-size: 24px;
          font-weight: bold;
          color: #4ade80;
          text-shadow: 0 0 10px rgba(74, 222, 128, 0.3);
        }
        .status {
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: 10px;
          text-align: center;
          color: #93c5fd;
          padding: 16px;
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }
        .loading {
          display: inline-block;
          width: 18px;
          height: 18px;
          border: 3px solid rgba(147, 197, 253, 0.3);
          border-top-color: #93c5fd;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          vertical-align: middle;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .results {
          margin-top: 16px;
          flex: 1;
          min-height: 0;
          overflow-y: visible;
        }
        .result-item {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 10px;
          padding: 14px;
          margin-bottom: 12px;
          transition: all 0.2s ease;
        }
        .result-item:hover {
          background: rgba(255, 255, 255, 0.12);
          border-color: rgba(74, 222, 128, 0.5);
          transform: translateX(-2px);
        }
        .result-platform {
          font-weight: bold;
          color: #60a5fa;
          font-size: 15px;
          margin-bottom: 6px;
        }
        .result-price {
          color: #4ade80;
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 4px;
        }
        .result-savings {
          color: #86efac;
          font-size: 12px;
          margin-top: 6px;
        }
        .result-url {
          color: #93c5fd;
          font-size: 13px;
          text-decoration: none;
          cursor: pointer;
          margin-top: 8px;
          display: inline-block;
          padding: 6px 12px;
          background: rgba(59, 130, 246, 0.2);
          border-radius: 6px;
          border: 1px solid rgba(59, 130, 246, 0.3);
          transition: all 0.2s ease;
        }
        .result-url:hover {
          color: #fff;
          background: rgba(59, 130, 246, 0.4);
          border-color: rgba(59, 130, 246, 0.6);
        }
        .no-results {
          color: #fbbf24;
          text-align: center;
          padding: 16px;
          background: rgba(251, 191, 36, 0.1);
          border: 1px solid rgba(251, 191, 36, 0.3);
          border-radius: 10px;
        }
      </style>
      <div class="overlay-container">
        <div class="header" style="flex-shrink: 0;">
          <span>💰</span>
          <span>ShopMentor AI</span>
        </div>
        <div class="product-info" style="flex-shrink: 0;">
          <div class="product-title">${productData.title}</div>
          <div class="product-price">${productData.currency === 'USD' ? '$' : '₪'}${parseFloat(productData.price).toFixed(2)}</div>
        </div>
        <div class="status" style="flex-shrink: 0;">
          <span>${getString('analyzing')}</span>
          <span class="loading"></span>
        </div>
        <div class="results" id="results" style="flex: 1; min-height: 0; overflow-y: visible;"></div>
      </div>
    `;

    // Position Overlay near the button
    positionOverlay(shadowHost, position);

    overlayElement = shadowHost;

    // Add event listeners to overlay
    // This allows keeping the overlay open when mouse is over it
    shadowHost.addEventListener('mouseenter', handleOverlayMouseEnter);
    shadowHost.addEventListener('mouseleave', handleOverlayMouseLeave);

    // Return shadowRoot so we can update the content later
    // Also shadowHost so we can access it
    shadowRoot.shadowHost = shadowHost;
    return shadowRoot;
  }

  // Position Overlay
  // positionOverlay - function that positions the overlay at the top of the screen
  function positionOverlay(element, position) {
    const overlayWidth = 400;
    const overlayHeight = Math.min(window.innerHeight * 0.9, 700); // Maximum 90% of screen height
    
    // Position at top of screen - so we can see the entire popup
    const top = 30; // 30px from top
    
      // If there's a position (button), place it close to it horizontally
    let left;
    if (position) {
      const buttonViewportLeft = position.left;
      
      // Place overlay to the right of the button
      left = buttonViewportLeft + position.width + 20; // 20px spacing
      
      // If no room on the right, place on the left
      if (left + overlayWidth > window.innerWidth - 20) {
        left = buttonViewportLeft - overlayWidth - 20;
      }
      
      // If that doesn't work either (button in center), center it horizontally
      if (left < 20) {
        const centerX = window.innerWidth / 2;
        left = centerX - (overlayWidth / 2);
      }
      
      // Ensure position doesn't go off screen
      left = Math.max(20, Math.min(left, window.innerWidth - overlayWidth - 20));
    } else {
      // If no position, center it horizontally as well
      const centerX = window.innerWidth / 2;
      left = centerX - (overlayWidth / 2);
    }
    
    element.style.position = 'fixed'; // Important: fixed - doesn't scroll with page
    element.style.top = `${top}px`;
    element.style.left = `${left}px`;
    element.style.zIndex = '999999'; // Very high
  }

  // Check prices in background
  // checkCheaperPrice - function that sends a request to background.js to check prices
  async function checkCheaperPrice(productData, shadowRoot) {
    // Check that shadowRoot is valid - if not, exit function
    if (!shadowRoot) {
      return;
    }
    
    
    // Check that chrome.runtime exists (if not, extension is not loaded)
    if (!chrome || !chrome.runtime || !chrome.runtime.sendMessage) {
      displayError('ההרחבה לא טעונה כראוי. נסה לרענן את הדף.', shadowRoot);
      return;
    }
    
    try {
      // Call background.js
      // chrome.runtime.sendMessage - Chrome API for sending message to background
      // action: 'checkPrice' - type of action
      // productData - product data
      
      console.log('📤 ShopMentor AI: Sending to server:', {
        site: productData.site,
        title: productData.title?.substring(0, 50),
        price: productData.price,
        currency: productData.currency
      });
      
      const response = await chrome.runtime.sendMessage({
        action: 'checkPrice',
        productData: productData
      });
      
      console.log('📥 ShopMentor AI: Received response from server:', response?.success ? 'Success' : 'Failed');


      // Additional check that shadowRoot is still valid (overlay may have closed)
      if (!shadowRoot || !overlayElement) {
        return;
      }

      // Check that response succeeded
      if (response && response.success) {
        // Display results
        displayResults(response, shadowRoot);
      } else if (response && response.error === 'payment_required') {
        // Free usage limit reached - show payment / upgrade message
        displayPaymentRequired(response, shadowRoot);
      } else {
        // If failed, display error message
        displayError(response?.error || 'שגיאה בבדיקת מחירים', shadowRoot);
      }
    } catch (error) {
      // Special handling for "Extension context invalidated" - happens when extension updates
      // Check the error message and type
      const errorMessage = error?.message || error?.toString() || '';
      const isContextInvalidated = errorMessage.includes('Extension context invalidated') || 
                                   errorMessage.includes('context invalidated') ||
                                   error?.name === 'ExtensionContextInvalidatedError';
      
      if (isContextInvalidated) {
        // This is a known error - don't display it in console.error to avoid alarming
        // Don't show message to user - this is normal during development
        // User can refresh the page if needed
        return;
      }
      
      // Other errors - display them
      
      // Additional check that shadowRoot is still valid
      if (shadowRoot && overlayElement) {
        const errorMsg = errorMessage.includes('timeout') ? 'הבקשה לשרת ארכה יותר מדי זמן' :
                        errorMessage.includes('fetch') || errorMessage.includes('network') ? 'שגיאה בחיבור לשרת' :
                        'שגיאה בחיבור ל-background';
        displayError(errorMsg, shadowRoot);
      }
    }
  }

  // Display sales advice
  // displayResults - function that displays sales advice in overlay
  function displayResults(response, shadowRoot) {
    // Check that shadowRoot is valid
    if (!shadowRoot) {
      return;
    }
    
    const resultsContainer = shadowRoot.getElementById('results');
    if (!resultsContainer) {
      return;
    }

    // Remove loading status
    const statusEl = shadowRoot.querySelector('.status');
    if (statusEl) {
      statusEl.style.display = 'none';
    }

    // Build HTML for sales advice
    let html = '';

    // Check if there's salesAdvice (new structure) or prices (old structure)
    const salesAdvice = response.salesAdvice || {};
    const originalPrice = parseFloat(response.originalPrice || 0);
    
    // Determine currency from response or productData
    const currency = response.currency || response.productData?.currency || 'ILS';
    const currencySymbol = currency === 'USD' ? '$' : '₪';

    // If there's salesAdvice, display sales advice
    if (salesAdvice && Object.keys(salesAdvice).length > 0) {
      // 0. Product Overview (FIRST)
      if (salesAdvice.productOverview) {
        const overview = salesAdvice.productOverview;
        html += `
          <div class="result-item" style="border-left: 4px solid #8b5cf6; margin-bottom: 16px;">
            <div class="result-platform">📦 ${getString('productOverview')}</div>
            <div style="color: #e2e8f0; font-size: 13px; margin-top: 8px; line-height: 1.6;">
              ${overview.description || getString('notAvailable')}
            </div>
            ${overview.targetAudience ? `<div style="color: #94a3b8; font-size: 12px; margin-top: 6px;">👥 ${getString('targetAudience')}: ${overview.targetAudience}</div>` : ''}
            ${overview.category ? `<div style="color: #94a3b8; font-size: 12px; margin-top: 4px;">🏷️ ${getString('category')}: ${overview.category}</div>` : ''}
            ${overview.mainFeatures && overview.mainFeatures.length > 0 ? `
              <div style="color: #94a3b8; font-size: 12px; margin-top: 6px;">
                <strong>${getString('mainFeatures')}:</strong>
                <ul style="margin-top: 4px; padding-right: 20px;">
                  ${overview.mainFeatures.map(f => `<li>${f}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        `;
      }
      
      // 1. Buying Advice
      if (salesAdvice.buyingAdvice) {
        const advice = salesAdvice.buyingAdvice;
        const timeIcon = advice.isGoodTimeToBuy === 'yes' ? '✅' : advice.isGoodTimeToBuy === 'no' ? '❌' : '⚠️';
        html += `
          <div class="result-item" style="border-left: 4px solid #60a5fa;">
            <div class="result-platform">${timeIcon} ${getString('buyingAdvice')}</div>
            <div style="color: #e2e8f0; font-size: 13px; margin-top: 8px; line-height: 1.5;">
              ${advice.recommendation || getString('notAvailable')}
            </div>
            ${advice.priceAssessment ? `<div style="color: #86efac; font-size: 12px; margin-top: 6px;">${getString('priceAssessment')}: ${advice.priceAssessment}</div>` : ''}
            ${advice.waitForSale ? `
              <div style="color: #fbbf24; font-size: 12px; margin-top: 6px; padding: 8px; background: rgba(251, 191, 36, 0.1); border-radius: 6px; border: 1px solid rgba(251, 191, 36, 0.3);">
                💡 ${getString('waitForSale')}
                ${advice.nextSaleDate ? `<div style="margin-top: 4px; font-weight: bold;">📅 ${getString('expectedSale')}: ${advice.nextSaleDate}</div>` : ''}
                ${advice.expectedSalePrice ? `<div style="margin-top: 4px;">💰 ${getString('expectedPrice')}: ${advice.expectedSalePrice}</div>` : ''}
              </div>
            ` : ''}
          </div>
        `;
      }

      // 2. Competitors
      if (salesAdvice.competitors && salesAdvice.competitors.length > 0) {
        // Get current site for currency display
        const currentSite = window.location.hostname.toLowerCase().includes('ebay') ? 'ebay' : 'other';
        
        // Building search URL according to current site
        // (KSP search doesn't work well with product names, so we use Amazon for KSP)
        const currentUrl = window.location.href;
        let searchUrlTemplate = '';
        
        try {
          const urlObj = new URL(currentUrl);
          const hostname = urlObj.hostname.toLowerCase();
          
          // Building search URL according to site
          if (hostname.includes('amazon')) {
            searchUrlTemplate = `https://${urlObj.hostname}/s?k=`;
          } else if (hostname.includes('aliexpress')) {
            searchUrlTemplate = `https://${urlObj.hostname}/wholesale?SearchText=`;
          } else if (hostname.includes('ebay')) {
            searchUrlTemplate = `https://${urlObj.hostname}/sch/i.html?_nkw=`;
          } else if (hostname.includes('ksp')) {
            // KSP search doesn't work well - use Amazon instead
            searchUrlTemplate = 'https://www.amazon.com/s?k=';
          } else {
            // For other sites, use Amazon as default
            searchUrlTemplate = 'https://www.amazon.com/s?k=';
          }
        } catch (e) {
          // Could not parse URL - use Amazon as fallback
          searchUrlTemplate = 'https://www.amazon.com/s?k=';
        }
        
        html += `
          <div class="result-item" style="border-left: 4px solid #4ade80;">
            <div class="result-platform">🏆 ${getString('competitors')}</div>
            ${salesAdvice.competitors.map(comp => {
              const competitorName = comp.name || getString('unknown');
              const searchQuery = encodeURIComponent(competitorName);
              
              // Create search URL if we have a template
              let searchUrl = '';
              if (searchUrlTemplate) {
                searchUrl = `${searchUrlTemplate}${searchQuery}`;
              }
              
              return `
              <div style="color: #e2e8f0; font-size: 12px; margin-top: 6px; padding: 6px; background: rgba(255,255,255,0.05); border-radius: 4px;">
                <strong>${competitorName}</strong>
                ${comp.comparison ? `<div style="color: #94a3b8; font-size: 11px; margin-top: 4px;">${comp.comparison}</div>` : ''}
                ${comp.price ? `<div style="color: #86efac; font-size: 11px; margin-top: 2px;">${currencySymbol}${comp.price}</div>` : ''}
                ${searchUrl ? `<div class="result-url" data-url="${searchUrl}" style="margin-top: 6px; font-size: 11px; cursor: pointer;">⬅️ ${getString('searchFor')} "${competitorName}"</div>` : ''}
              </div>
            `;
            }).join('')}
          </div>
        `;
      }

      // 3. Best Product in Category (specific model)
      if (salesAdvice.bestBrand && salesAdvice.bestBrand.name) {
        const bestBrand = salesAdvice.bestBrand;
        html += `
          <div class="result-item" style="border-left: 4px solid #fbbf24;">
            <div class="result-platform">⭐ ${getString('bestProduct')}</div>
            <div style="color: #e2e8f0; font-size: 13px; margin-top: 8px;">
              <strong>${bestBrand.fullName || bestBrand.name}</strong>
              ${bestBrand.modelNumber ? `<div style="color: #94a3b8; font-size: 11px; margin-top: 2px;">${getString('model')}: ${bestBrand.modelNumber}</div>` : ''}
              ${bestBrand.price ? `<div style="color: #4ade80; font-size: 12px; font-weight: bold; margin-top: 4px;">${currencySymbol}${bestBrand.price}</div>` : ''}
            </div>
            ${bestBrand.reason ? `<div style="color: #94a3b8; font-size: 12px; margin-top: 6px;">${bestBrand.reason}</div>` : ''}
            ${bestBrand.keyAdvantages && bestBrand.keyAdvantages.length > 0 ? `
              <div style="color: #94a3b8; font-size: 12px; margin-top: 6px;">
                <strong>${getString('keyAdvantages')}:</strong>
                <ul style="margin-top: 4px; padding-right: 20px;">
                  ${bestBrand.keyAdvantages.map(adv => `<li>${adv}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
            ${bestBrand.currentProductComparison ? `<div style="color: #86efac; font-size: 12px; margin-top: 6px;">${getString('comparison')}: ${bestBrand.currentProductComparison}</div>` : ''}
          </div>
        `;
      }

      // 4. AliExpress Alternative
      if (salesAdvice.aliexpressAlternative) {
        const aliAlt = salesAdvice.aliexpressAlternative;
        if (aliAlt.available) {
          html += `
            <div class="result-item" style="border-left: 4px solid #ec4899;">
              <div class="result-platform">🇨🇳 ${getString('aliexpressAlternative')}</div>
              <div style="color: #e2e8f0; font-size: 13px; margin-top: 8px;">
                ${aliAlt.recommendation || getString('notAvailable')}
              </div>
              ${aliAlt.price ? `<div style="color: #86efac; font-size: 14px; font-weight: bold; margin-top: 6px;">${currencySymbol}${aliAlt.price}</div>` : ''}
              ${aliAlt.qualityAssessment ? `<div style="color: #fbbf24; font-size: 12px; margin-top: 4px;">${getString('quality')}: ${aliAlt.qualityAssessment}</div>` : ''}
              ${aliAlt.searchKeywords ? `<div class="result-url" data-url="https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(aliAlt.searchKeywords)}" style="margin-top: 8px; cursor: pointer;">⬅️ ${getString('searchOnAli')}</div>` : ''}
            </div>
          `;
        }
      }

      // 5. New Model
      if (salesAdvice.newModelTiming) {
        const timing = salesAdvice.newModelTiming;
        if (timing.expectedSoon || timing.shouldWait) {
          html += `
            <div class="result-item" style="border-left: 4px solid #8b5cf6;">
              <div class="result-platform">🆕 ${getString('newModel')}</div>
              <div style="color: #e2e8f0; font-size: 13px; margin-top: 8px;">
                ${timing.shouldWait ? `⏳ ${getString('shouldWait')}` : `ℹ️ ${getString('expectedSoon')}`}
              </div>
              ${timing.reasoning ? `<div style="color: #94a3b8; font-size: 12px; margin-top: 6px;">${timing.reasoning}</div>` : ''}
            </div>
          `;
        }
      }

      // 6. Price comparison - removed per user request
      // (Search for best product on site removed)
    } else {
      html = `<div class="no-results">${getString('notAvailable')}</div>`;
    }

    resultsContainer.innerHTML = html;

    // Add event listeners to links
    const urlLinks = resultsContainer.querySelectorAll('.result-url');
    urlLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault(); // Prevents default behavior
        e.stopPropagation(); // Prevents event bubbling
        
        const url = e.target.getAttribute('data-url') || e.target.closest('.result-url')?.getAttribute('data-url');
        
        if (url) {
          try {
            // Check that link is valid
            const urlObj = new URL(url);
            
            // Open link in new window
            window.open(url, '_blank', 'noopener,noreferrer');
          } catch (error) {
            // If URL is not valid, try to fix it
            const fixedUrl = url.startsWith('http') ? url : `https://${url}`;
            try {
              window.open(fixedUrl, '_blank', 'noopener,noreferrer');
            } catch (secondError) {
              alert('שגיאה בפתיחת הקישור. נסה להעתיק את הקישור ידנית.');
            }
          }
        }
      });
    });
  }

  // Display error
  // displayError - function that displays error message
  function displayError(errorMessage, shadowRoot) {
    // Check that shadowRoot is valid
    if (!shadowRoot) {
      return;
    }
    
    try {
      const statusEl = shadowRoot.querySelector('.status');
      if (statusEl) {
        statusEl.innerHTML = `<span style="color: #f87171;">${errorMessage}</span>`;
        statusEl.querySelector('.loading')?.remove();
      }
    } catch (error) {
    }
  }

  // Display message when free usage limit is reached and payment is required
  function displayPaymentRequired(response, shadowRoot) {
    if (!shadowRoot) {
      return;
    }

    try {
      const statusEl = shadowRoot.querySelector('.status');
      if (statusEl) {
        statusEl.style.display = 'none';
      }

      const resultsContainer = shadowRoot.getElementById('results');
      if (!resultsContainer) {
        return;
      }

      const usage = response.usage || {};
      const used = typeof usage.used === 'number' ? usage.used : 5;
      const freeLimit = typeof usage.freeLimit === 'number' ? usage.freeLimit : 5;
      const remaining = Math.max(0, freeLimit - used);

      const messageTitle = 'הגעת לסיום השימוש החינמי';
      const messageBody = `ניצלת ${used} מתוך ${freeLimit} שימושים חינמיים ב-ShopMentor AI.`;
      const messageNote = remaining <= 0
        ? 'כדי להמשיך להשתמש בעוזר הקנייה, יש להשלים תשלום (Stripe).'
        : `נותרו לך עוד ${remaining} שימושים חינמיים.`;

      resultsContainer.innerHTML = `
        <div class="result-item" style="border-left: 4px solid #f97316;">
          <div class="result-platform">⚠️ ${messageTitle}</div>
          <div style="color: #e2e8f0; font-size: 13px; margin-top: 8px; line-height: 1.6;">
            ${messageBody}
          </div>
          <div style="color: #fbbf24; font-size: 12px; margin-top: 8px;">
            ${messageNote}
          </div>
          <div style="margin-top: 12px; font-size: 12px; color: #94a3b8;">
            בקרוב נוסיף תהליך תשלום אוטומטי דרך Stripe מתוך התוסף.
          </div>
        </div>
      `;
    } catch (error) {
      console.error('ShopMentor AI: Error in displayPaymentRequired:', error);
      displayError('שגיאה בהצגת הודעת התשלום', shadowRoot);
    }
  }

  // Detect Hover on buttons
  // handleHover - function that handles hover on buttons
  let hoverTimeout = null; // timeout for managing debounce
  let currentShadowRoot = null; // save shadowRoot so we can remove overlay
  let isMouseOverOverlay = false; // flag - whether mouse is over overlay
  let closeOverlayTimeout = null; // timeout for closing overlay (with delay)

  function handleHover(event) {
    // Stop timeout first (debounce)
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      hoverTimeout = null;
    }

    // Close overlay first if exists - so previous product overlay doesn't remain
    if (overlayElement) {
      overlayElement.remove();
      overlayElement = null;
      currentShadowRoot = null;
      isMouseOverOverlay = false;
    }
    
    // Cancel close timeout if exists
    if (closeOverlayTimeout) {
      clearTimeout(closeOverlayTimeout);
      closeOverlayTimeout = null;
    }

    // Get button/card position
    const targetElement = event.target;
    const buttonRect = targetElement.getBoundingClientRect();

    // Wait HOVER_DEBOUNCE_MS before showing overlay
    hoverTimeout = setTimeout(async () => {
      // Detect site
      const site = detectSite();
      if (!site) {
        return;
      }


      // Extract product data - if it's a product card, search inside it
      const productData = extractProductData(site, targetElement);
      if (!productData) {
        return;
      }

      console.log('✅ ShopMentor AI: Extracted product data:', {
        site: productData.site,
        title: productData.title?.substring(0, 50),
        price: productData.price,
        currency: productData.currency
      });

      // Create overlay
      currentShadowRoot = createOverlay(productData, buttonRect);

      // Check prices
      await checkCheaperPrice(productData, currentShadowRoot);
    }, HOVER_DEBOUNCE_MS);
  }

  // Remove Overlay
  // handleMouseLeave - function that removes overlay when mouse leaves
  // Now only closes if mouse is not over overlay
  function handleMouseLeave() {
    // Cancel timeout if it exists
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      hoverTimeout = null;
    }

    // Close overlay only if mouse is not over overlay
    // If mouse is over overlay, don't close it
    if (isMouseOverOverlay) {
      return; // Mouse is over overlay, don't close
    }

    // Close overlay with small delay (allows smooth transition from button to overlay)
    // Cancel timeout first if exists
    if (closeOverlayTimeout) {
      clearTimeout(closeOverlayTimeout);
    }

    closeOverlayTimeout = setTimeout(() => {
      // Additional check - if mouse is not over overlay, close it
      if (!isMouseOverOverlay && overlayElement) {
        overlayElement.remove();
        overlayElement = null;
        currentShadowRoot = null;
        isMouseOverOverlay = false;
      }
      closeOverlayTimeout = null;
    }, 100); // 100ms delay - allows smooth transition from button to overlay
  }

  // Functions for managing overlay hover
  // handleOverlayMouseEnter - when mouse enters overlay
  function handleOverlayMouseEnter() {
    isMouseOverOverlay = true;
    // Cancel close timeout if exists
    if (closeOverlayTimeout) {
      clearTimeout(closeOverlayTimeout);
      closeOverlayTimeout = null;
    }
  }

  // handleOverlayMouseLeave - when mouse leaves overlay
  function handleOverlayMouseLeave() {
    isMouseOverOverlay = false;
    // Close overlay after short delay
    if (closeOverlayTimeout) {
      clearTimeout(closeOverlayTimeout);
    }
    closeOverlayTimeout = setTimeout(() => {
      if (overlayElement && !isMouseOverOverlay) {
        overlayElement.remove();
        overlayElement = null;
        currentShadowRoot = null;
      }
      closeOverlayTimeout = null;
    }, 200); // 200ms delay - allows returning to overlay if needed
  }

  // Initialization - Add Event Listeners
  // init - function that starts all the logic
  function init() {
    const site = detectSite();
    if (!site) {
      return;
    }


    // Find all buttons and add event listeners
    const config = SITE_CONFIG[site];
    
    // Function that searches for buttons and adds listeners to them
    function attachListeners() {
      let totalButtons = 0;
      
      // Search all buttons by selectors
      for (const selector of config.buttonSelectors) {
        try {
          const buttons = document.querySelectorAll(selector);
          totalButtons += buttons.length;
          buttons.forEach(button => {
            // Check that button hasn't received listener yet
            if (!button.dataset.shopmentorAttached) {
              button.dataset.shopmentorAttached = 'true';
              button.addEventListener('mouseenter', handleHover);
              button.addEventListener('mouseleave', handleMouseLeave);
            }
          });
        } catch (e) {
          // If selector is not valid (e.g., :contains), skip it
        }
      }
      
      
      if (totalButtons === 0) {
        // Try to find buttons by text - including div/span that look like buttons
        // Text-based matching for buttons - including Hebrew
        const allButtons = document.querySelectorAll('button, a[role="button"], input[type="button"], input[type="submit"], [class*="button"], [title], div[role="button"], div[onclick], div[class*="btn"], div[class*="Btn"]');
        
        allButtons.forEach(button => {
          const text = (button.textContent || button.value || button.getAttribute('aria-label') || button.getAttribute('title') || '').toLowerCase();
          const buttonText = button.textContent || button.innerText || '';
          const buttonTitle = button.getAttribute('title') || '';
          const fullText = (text + ' ' + buttonText + ' ' + buttonTitle).toLowerCase();
          
          // Check in English and Hebrew - including text inside span/div
          const spanText = button.querySelector('span')?.textContent || '';
          const divText = button.querySelector('div')?.textContent || '';
          const svgTitle = button.querySelector('svg title')?.textContent || '';
          const allText = (fullText + ' ' + spanText + ' ' + divText + ' ' + svgTitle).toLowerCase();
          
          // Also check by class names
          const className = (button.className || '').toLowerCase();
          const id = (button.id || '').toLowerCase();
          
          // Check if there's an SVG cart icon - KSP specific
          const hasCartIcon = button.querySelector('svg') !== null && (
            button.querySelector('svg[class*="cart"]') !== null ||
            button.querySelector('svg[class*="Cart"]') !== null ||
            button.querySelector('svg path[d*="M"]') !== null ||
            button.querySelector('svg[aria-label*="cart"]') !== null ||
            button.querySelector('svg[aria-label*="Cart"]') !== null ||
            button.querySelector('svg path') !== null // Any SVG with path (likely an icon)
          );
          
          const isAddToCart = (allText.includes('add') && allText.includes('cart')) || 
                              allText.includes('הוסף לעגלה') ||
                              allText.includes('הוספה לעגלה') ||
                              allText.includes('הוסף לסל') ||
                              buttonText.includes('הוספה לעגלה') ||
                              buttonText.includes('הוסף לעגלה') ||
                              className.includes('cart') ||
                              className.includes('add') ||
                              id.includes('cart') ||
                              id.includes('add') ||
                              hasCartIcon;
          const isBuyNow = (allText.includes('buy') && allText.includes('now')) ||
                          allText.includes('קנה עכשיו') ||
                          allText.includes('קנה');
          const isAddToList = (allText.includes('add') && allText.includes('list')) ||
                             (allText.includes('add') && allText.includes('wishlist'));
          
          if (isAddToCart || isBuyNow || isAddToList) {
            if (!button.dataset.shopmentorAttached) {
              button.dataset.shopmentorAttached = 'true';
              button.addEventListener('mouseenter', handleHover);
              button.addEventListener('mouseleave', handleMouseLeave);
            }
          }
        });
        
        // If still not found, try searching by color/location (yellow buttons with cart icon) - KSP specific
        const hostname = window.location.hostname.toLowerCase();
        if (totalButtons === 0 && hostname.includes('ksp')) {
          // Search for yellow buttons or with SVG cart icon
          const allElements = document.querySelectorAll('button, div, a, span');
          let foundKspButtons = 0;
          
          allElements.forEach(el => {
            try {
              const style = window.getComputedStyle(el);
              const bgColor = style.backgroundColor || '';
              const isYellow = bgColor.includes('rgb(255, 193, 7)') || 
                              bgColor.includes('rgb(255, 193, 7)') ||
                              bgColor.includes('#FFC107') ||
                              bgColor.includes('yellow') ||
                              el.style.backgroundColor?.includes('yellow') ||
                              el.style.backgroundColor?.includes('#FFC107');
              const hasSvg = el.querySelector('svg') !== null;
              const isClickable = el.onclick !== null || 
                                 el.getAttribute('role') === 'button' ||
                                 el.tagName === 'BUTTON' ||
                                 el.tagName === 'A' ||
                                 el.style.cursor === 'pointer';
              
              // If it's a yellow button with SVG, or button with SVG inside product card
              const isInProductCard = el.closest('[class*="product"]') !== null ||
                                      el.closest('[class*="item"]') !== null ||
                                      el.closest('[class*="card"]') !== null;
              if (isClickable && ((isYellow && hasSvg) || (hasSvg && isInProductCard))) {
                if (!el.dataset.shopmentorAttached) {
                  el.dataset.shopmentorAttached = 'true';
                  el.addEventListener('mouseenter', handleHover);
                  el.addEventListener('mouseleave', handleMouseLeave);
                  foundKspButtons++;
                }
              }
            } catch (e) {
              // ignore errors
            }
          });
          
          if (foundKspButtons > 0) {
          }
        }
        
        // If it's a search page on Amazon, also attach to product cards
        if (site === 'amazon' && window.location.pathname.includes('/s?')) {
          const productCards = document.querySelectorAll('div[data-component-type="s-search-result"], [data-asin]');
          productCards.forEach(card => {
            if (!card.dataset.shopmentorAttached) {
              card.dataset.shopmentorAttached = 'true';
              card.addEventListener('mouseenter', handleHover);
              card.addEventListener('mouseleave', handleMouseLeave);
            }
          });
        }
        
        // If it's eBay, also try to search for buttons by text (Buy It Now, Add to Cart)
        if (site === 'ebay' && totalButtons === 0) {
          const allElements = document.querySelectorAll('button, a, [role="button"], [data-testid], [class*="btn"], [class*="button"]');
          let foundEbayButtons = 0;
          allElements.forEach(el => {
            const text = (el.textContent || el.getAttribute('aria-label') || el.getAttribute('title') || '').toLowerCase();
            const testId = el.getAttribute('data-testid') || '';
            const className = (el.className || '').toLowerCase();
            const id = (el.id || '').toLowerCase();
            
            const isEbayButton = 
              text.includes('buy it now') || 
              text.includes('add to cart') || 
              text.includes('watch') ||
              testId.includes('ux-call-to-action') ||
              testId.includes('atc') ||
              testId.includes('bin') ||
              testId.includes('watch') ||
              className.includes('call-to-action') ||
              id.includes('atc') ||
              id.includes('bin');
            
            if (isEbayButton && !el.dataset.shopmentorAttached) {
              el.dataset.shopmentorAttached = 'true';
              el.addEventListener('mouseenter', handleHover);
              el.addEventListener('mouseleave', handleMouseLeave);
              foundEbayButtons++;
            }
          });
        }
      }
    }

    // Initial run
    attachListeners();

    // MutationObserver - Monitor page changes
    // Sometimes sites load content dynamically (AJAX)
    // MutationObserver - JavaScript API that allows monitoring DOM changes
    // This is important because buttons can appear after page loads
    const observer = new MutationObserver(() => {
      // When something changes on the page, try to find new buttons
      attachListeners();
    });

    // Start monitoring changes
    // childList: true - monitor addition/removal of elements
    // subtree: true - monitor entire tree (all children)
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Run init when page loads
  // If page is already loaded, run immediately
  // Otherwise, wait for DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
