/**
 * Analytics Data Layer
 * GTM/GA4 event tracking and email platform integration
 * Supports: Klaviyo, Seguno, Mailchimp, HubSpot
 */

(function() {
  'use strict';

  // Initialize data layer
  window.dataLayer = window.dataLayer || [];

  /**
   * Analytics Manager
   */
  class Analytics {
    constructor() {
      this.init();
    }

    init() {
      this.trackPageView();
      this.setupEcommerceTracking();
      this.setupFormTracking();
      this.setupSearchTracking();
      this.setupCartTracking();
      this.setupQuoteTracking();
      this.setupEmailTracking();
      this.setupBrowseAbandonmentTracking();
    }

    /**
     * Push event to data layer
     */
    push(event, data = {}) {
      window.dataLayer.push({
        event: event,
        ...data,
        timestamp: new Date().toISOString()
      });
    }

    /**
     * Track page view
     */
    trackPageView() {
      const pageData = {
        event: 'page_view',
        page_type: window.Shopify?.designMode ? 'theme_editor' : this.getPageType(),
        page_title: document.title,
        page_path: window.location.pathname
      };

      // Add template info
      const body = document.body;
      if (body.classList.contains('template-product')) {
        pageData.product_id = this.getMetaContent('product:id');
        pageData.product_name = this.getMetaContent('og:title');
      } else if (body.classList.contains('template-collection')) {
        pageData.collection_handle = window.location.pathname.split('/').pop();
      }

      this.push('page_view', pageData);
    }

    /**
     * Get page type from body class
     */
    getPageType() {
      const body = document.body;
      if (body.classList.contains('template-index')) return 'home';
      if (body.classList.contains('template-product')) return 'product';
      if (body.classList.contains('template-collection')) return 'collection';
      if (body.classList.contains('template-cart')) return 'cart';
      if (body.classList.contains('template-search')) return 'search';
      if (body.classList.contains('template-page')) return 'page';
      if (body.classList.contains('template-blog')) return 'blog';
      if (body.classList.contains('template-article')) return 'article';
      if (body.classList.contains('template-customers-login')) return 'login';
      if (body.classList.contains('template-customers-account')) return 'account';
      return 'other';
    }

    /**
     * Get meta tag content
     */
    getMetaContent(name) {
      const meta = document.querySelector(`meta[property="${name}"], meta[name="${name}"]`);
      return meta ? meta.content : null;
    }

    /**
     * E-commerce tracking
     */
    setupEcommerceTracking() {
      // Product view
      if (document.body.classList.contains('template-product')) {
        this.trackProductView();
      }

      // Collection view
      if (document.body.classList.contains('template-collection')) {
        this.trackCollectionView();
      }
    }

    trackProductView() {
      const productJson = document.querySelector('[data-product-json]');
      if (!productJson) return;

      try {
        const product = JSON.parse(productJson.textContent);
        this.push('view_item', {
          currency: window.Shopify?.currency?.active || 'USD',
          value: product.price / 100,
          items: [{
            item_id: product.id,
            item_name: product.title,
            item_brand: product.vendor,
            item_category: product.type,
            price: product.price / 100,
            quantity: 1
          }]
        });

        // Klaviyo viewed product
        if (window._learnq) {
          window._learnq.push(['track', 'Viewed Product', {
            ProductID: product.id,
            ProductName: product.title,
            ProductURL: window.location.href,
            ImageURL: product.featured_image,
            Brand: product.vendor,
            Price: product.price / 100,
            Categories: [product.type]
          }]);
        }
      } catch (e) {
        console.error('Analytics: Error tracking product view', e);
      }
    }

    trackCollectionView() {
      const collectionTitle = document.querySelector('.collection-header__title, h1')?.textContent;
      const productCards = document.querySelectorAll('[data-product-card]');
      
      const items = [];
      productCards.forEach((card, index) => {
        const id = card.dataset.productId;
        const title = card.querySelector('.product-card__title')?.textContent;
        const price = card.querySelector('.product-card__price')?.dataset.price;
        
        if (id && title) {
          items.push({
            item_id: id,
            item_name: title.trim(),
            price: price ? parseFloat(price) / 100 : 0,
            index: index
          });
        }
      });

      if (items.length) {
        this.push('view_item_list', {
          item_list_name: collectionTitle || 'Collection',
          items: items.slice(0, 20) // Limit to first 20
        });
      }
    }

    /**
     * Form tracking
     */
    setupFormTracking() {
      // Newsletter forms
      document.querySelectorAll('.newsletter-signup-form, [action*="contact"]').forEach(form => {
        form.addEventListener('submit', (e) => {
          const formType = form.classList.contains('newsletter-signup-form') ? 'newsletter' : 'contact';
          this.push('form_submit', {
            form_type: formType,
            form_id: form.id || 'unknown'
          });
        });
      });

      // Customer login
      document.querySelectorAll('form[action*="login"]').forEach(form => {
        form.addEventListener('submit', () => {
          this.push('login_attempt', { method: 'email' });
        });
      });

      // Customer registration
      document.querySelectorAll('form[action*="register"]').forEach(form => {
        form.addEventListener('submit', () => {
          this.push('sign_up', { method: 'email' });
        });
      });
    }

    /**
     * Search tracking
     */
    setupSearchTracking() {
      // Track search queries
      const searchInput = document.querySelector('[name="q"]');
      if (searchInput) {
        const form = searchInput.closest('form');
        if (form) {
          form.addEventListener('submit', () => {
            const query = searchInput.value.trim();
            if (query) {
              this.push('search', {
                search_term: query
              });

              // Klaviyo search
              if (window._learnq) {
                window._learnq.push(['track', 'Searched Site', {
                  SearchTerm: query
                }]);
              }
            }
          });
        }
      }

      // Track search results page
      if (window.location.pathname.includes('/search')) {
        const params = new URLSearchParams(window.location.search);
        const query = params.get('q');
        const resultsCount = document.querySelectorAll('.search-results__item').length;
        
        if (query) {
          this.push('view_search_results', {
            search_term: query,
            results_count: resultsCount
          });
        }
      }
    }

    /**
     * Cart tracking
     */
    setupCartTracking() {
      // Listen for cart updates
      document.addEventListener('cart:updated', (e) => {
        const cart = e.detail?.cart;
        if (cart) {
          this.push('cart_updated', {
            currency: cart.currency || 'USD',
            value: cart.total_price / 100,
            items_count: cart.item_count
          });
        }
      });

      // Add to cart
      document.addEventListener('cart:add', (e) => {
        const item = e.detail?.item;
        if (item) {
          this.push('add_to_cart', {
            currency: window.Shopify?.currency?.active || 'USD',
            value: item.price / 100,
            items: [{
              item_id: item.product_id,
              item_name: item.product_title,
              item_variant: item.variant_title,
              price: item.price / 100,
              quantity: item.quantity
            }]
          });

          // Klaviyo added to cart
          if (window._learnq) {
            window._learnq.push(['track', 'Added to Cart', {
              ProductID: item.product_id,
              ProductName: item.product_title,
              Quantity: item.quantity,
              Price: item.price / 100,
              AddedItemImageURL: item.image
            }]);
          }
        }
      });

      // Remove from cart
      document.addEventListener('cart:remove', (e) => {
        const item = e.detail?.item;
        if (item) {
          this.push('remove_from_cart', {
            currency: window.Shopify?.currency?.active || 'USD',
            value: item.price / 100,
            items: [{
              item_id: item.product_id,
              item_name: item.product_title,
              item_variant: item.variant_title,
              price: item.price / 100,
              quantity: item.quantity
            }]
          });
        }
      });

      // Begin checkout (cart page)
      if (document.body.classList.contains('template-cart')) {
        this.trackBeginCheckout();
      }

      // Checkout button clicks
      document.querySelectorAll('[name="checkout"], .cart__checkout-button').forEach(btn => {
        btn.addEventListener('click', () => this.trackBeginCheckout());
      });
    }

    trackBeginCheckout() {
      fetch('/cart.js')
        .then(r => r.json())
        .then(cart => {
          const items = cart.items.map(item => ({
            item_id: item.product_id,
            item_name: item.product_title,
            item_variant: item.variant_title,
            price: item.price / 100,
            quantity: item.quantity
          }));

          this.push('begin_checkout', {
            currency: cart.currency || 'USD',
            value: cart.total_price / 100,
            items: items
          });

          // Klaviyo started checkout
          if (window._learnq) {
            window._learnq.push(['track', 'Started Checkout', {
              ItemCount: cart.item_count,
              CartTotal: cart.total_price / 100,
              Items: cart.items.map(i => ({
                ProductID: i.product_id,
                ProductName: i.product_title,
                Quantity: i.quantity,
                Price: i.price / 100
              }))
            }]);
          }
        });
    }

    /**
     * Quote tracking (B2B)
     */
    setupQuoteTracking() {
      // Quote form submissions
      document.addEventListener('quote:submitted', (e) => {
        const data = e.detail || {};
        this.push('quote_request', {
          items_count: data.items?.length || 0,
          total_value: data.total || 0
        });

        // Klaviyo quote request
        if (window._learnq && data.email) {
          window._learnq.push(['identify', { $email: data.email }]);
          window._learnq.push(['track', 'Quote Requested', {
            ItemCount: data.items?.length || 0,
            Items: data.items || []
          }]);
        }
      });

      // Quote add item
      document.addEventListener('quote:add', (e) => {
        const item = e.detail?.item;
        if (item) {
          this.push('add_to_quote', {
            item_id: item.product_id,
            item_name: item.title
          });
        }
      });
    }

    /**
     * Email platform tracking
     * Integrates with Klaviyo, Seguno, Mailchimp, HubSpot
     */
    setupEmailTracking() {
      // Listen for all email signup events
      document.addEventListener('email:subscribe', (e) => {
        const { email, firstName, source, form } = e.detail || {};
        
        this.push('email_subscribe', {
          email_source: source,
          has_first_name: !!firstName
        });

        // Klaviyo
        this.trackKlaviyoSubscribe(email, firstName, source);
        
        // HubSpot
        this.trackHubSpotSubscribe(email, firstName, source);
        
        // Seguno - Uses Shopify customer form, syncs automatically
      });
      
      // Back in Stock subscriptions
      document.addEventListener('backInStock:subscribe', (e) => {
        const { email, productId, variantId, productTitle, variantTitle } = e.detail || {};
        
        this.push('back_in_stock_signup', {
          product_id: productId,
          variant_id: variantId,
          product_title: productTitle
        });
        
        this.trackKlaviyoBIS(email, productId, variantId, productTitle, variantTitle);
      });
      
      // Email preference updates
      document.addEventListener('email:preferencesUpdated', (e) => {
        const { preferences } = e.detail || {};
        
        this.push('email_preferences_updated', {
          preferences: preferences
        });
      });
    }
    
    /**
     * Klaviyo specific tracking
     */
    trackKlaviyoSubscribe(email, firstName, source) {
      if (!window._learnq) return;
      
      const profile = { $email: email };
      if (firstName) profile.$first_name = firstName;
      
      window._learnq.push(['identify', profile]);
      window._learnq.push(['track', 'Newsletter Signup', {
        source: source,
        timestamp: new Date().toISOString()
      }]);
    }
    
    trackKlaviyoBIS(email, productId, variantId, productTitle, variantTitle) {
      if (!window._learnq) return;
      
      window._learnq.push(['identify', { $email: email }]);
      window._learnq.push(['track', 'Back In Stock Signup', {
        ProductID: productId,
        VariantID: variantId,
        ProductName: productTitle,
        VariantName: variantTitle
      }]);
    }
    
    /**
     * HubSpot specific tracking
     */
    trackHubSpotSubscribe(email, firstName, source) {
      if (!window._hsq) return;
      
      window._hsq.push(['identify', {
        email: email,
        firstname: firstName
      }]);
      window._hsq.push(['trackEvent', {
        id: 'Newsletter Signup',
        value: { source: source }
      }]);
    }
    
    /**
     * Browse abandonment tracking for email platforms
     */
    setupBrowseAbandonmentTracking() {
      // Track product views for browse abandonment
      if (document.body.classList.contains('template-product')) {
        this.trackBrowseAbandonment();
      }
      
      // Track collection views
      if (document.body.classList.contains('template-collection')) {
        this.trackCollectionBrowse();
      }
    }
    
    trackBrowseAbandonment() {
      const productJson = document.querySelector('[data-product-json]');
      if (!productJson) return;
      
      try {
        const product = JSON.parse(productJson.textContent);
        
        // Klaviyo viewed product (for browse abandonment flows)
        if (window._learnq) {
          window._learnq.push(['track', 'Viewed Product', {
            ProductID: product.id,
            ProductName: product.title,
            ProductURL: window.location.href,
            ImageURL: product.featured_image,
            Brand: product.vendor,
            Price: product.price / 100,
            Categories: [product.type],
            CompareAtPrice: product.compare_at_price ? product.compare_at_price / 100 : null
          }]);
        }
        
        // HubSpot product view
        if (window._hsq) {
          window._hsq.push(['trackEvent', {
            id: 'Viewed Product',
            value: {
              product_id: product.id,
              product_name: product.title,
              price: product.price / 100
            }
          }]);
        }
        
        // Store in session for abandonment tracking
        const viewedProducts = JSON.parse(sessionStorage.getItem('viewedProducts') || '[]');
        const exists = viewedProducts.find(p => p.id === product.id);
        if (!exists) {
          viewedProducts.push({
            id: product.id,
            title: product.title,
            url: window.location.href,
            image: product.featured_image,
            price: product.price / 100,
            viewedAt: new Date().toISOString()
          });
          // Keep last 10 viewed products
          if (viewedProducts.length > 10) viewedProducts.shift();
          sessionStorage.setItem('viewedProducts', JSON.stringify(viewedProducts));
        }
      } catch (e) {
        console.warn('Analytics: Error tracking browse abandonment', e);
      }
    }
    
    trackCollectionBrowse() {
      const collectionTitle = document.querySelector('.collection-header__title, h1')?.textContent;
      const collectionHandle = window.location.pathname.split('/').pop();
      
      // Klaviyo collection view
      if (window._learnq && collectionTitle) {
        window._learnq.push(['track', 'Viewed Collection', {
          CollectionName: collectionTitle.trim(),
          CollectionHandle: collectionHandle,
          URL: window.location.href
        }]);
      }
      
      // HubSpot collection view
      if (window._hsq && collectionTitle) {
        window._hsq.push(['trackEvent', {
          id: 'Viewed Collection',
          value: {
            collection_name: collectionTitle.trim(),
            collection_handle: collectionHandle
          }
        }]);
      }
    }
  }

  // Initialize when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new Analytics());
  } else {
    new Analytics();
  }

  // Expose for external use
  window.Analytics = Analytics;

})();
