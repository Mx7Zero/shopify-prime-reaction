/**
 * Liquid Effects - Water/Fluid Motion Animations
 * Matches the Reaxing/Fluiball brand theme with smooth, organic motion
 * Inspired by water physics and fluid dynamics
 */

(function() {
  'use strict';

  // ==========================================================================
  // CONFIGURATION
  // ==========================================================================

  const CONFIG = {
    // Blob animation settings
    blob: {
      count: 5,
      minSize: 100,
      maxSize: 400,
      speed: 0.002,
      colors: [
        'var(--color-liquid-1, rgba(59, 130, 246, 0.3))',
        'var(--color-liquid-2, rgba(99, 102, 241, 0.25))',
        'var(--color-liquid-3, rgba(139, 92, 246, 0.2))',
        'var(--color-liquid-4, rgba(14, 165, 233, 0.25))',
        'var(--color-liquid-5, rgba(6, 182, 212, 0.2))'
      ]
    },
    // Wave settings
    wave: {
      amplitude: 20,
      frequency: 0.02,
      speed: 0.03,
      layers: 3
    },
    // Ripple settings
    ripple: {
      duration: 800,
      maxRadius: 150,
      color: 'var(--color-primary-rgb, 26, 26, 26)'
    },
    // Performance
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
  };

  // ==========================================================================
  // BLOB ANIMATION
  // Organic, morphing blob shapes for backgrounds
  // ==========================================================================

  class BlobAnimation {
    constructor(container, options = {}) {
      this.container = typeof container === 'string' 
        ? document.querySelector(container) 
        : container;
      
      if (!this.container || CONFIG.reducedMotion) return;

      this.options = { ...CONFIG.blob, ...options };
      this.blobs = [];
      this.animationId = null;
      this.time = 0;

      this.init();
    }

    init() {
      // Create blob container
      this.blobContainer = document.createElement('div');
      this.blobContainer.className = 'liquid-blobs';
      this.blobContainer.setAttribute('aria-hidden', 'true');
      this.container.style.position = 'relative';
      this.container.style.overflow = 'hidden';
      this.container.prepend(this.blobContainer);

      // Create blobs
      for (let i = 0; i < this.options.count; i++) {
        this.createBlob(i);
      }

      // Start animation
      this.animate();

      // Pause on visibility change
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.pause();
        } else {
          this.play();
        }
      });
    }

    createBlob(index) {
      const blob = document.createElement('div');
      const size = this.randomBetween(this.options.minSize, this.options.maxSize);
      
      blob.className = 'liquid-blob';
      blob.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        background: ${this.options.colors[index % this.options.colors.length]};
        border-radius: 50%;
        filter: blur(40px);
        opacity: 0.7;
        pointer-events: none;
        will-change: transform;
        transform: translate3d(0, 0, 0);
      `;

      // Initial position
      const x = Math.random() * 100;
      const y = Math.random() * 100;
      
      this.blobs.push({
        element: blob,
        x,
        y,
        size,
        speedX: (Math.random() - 0.5) * 2,
        speedY: (Math.random() - 0.5) * 2,
        morphSpeed: Math.random() * 0.5 + 0.5,
        morphOffset: Math.random() * Math.PI * 2
      });

      this.blobContainer.appendChild(blob);
    }

    animate() {
      this.time += this.options.speed;

      this.blobs.forEach((blob, index) => {
        // Organic movement
        const moveX = Math.sin(this.time * blob.speedX + index) * 30;
        const moveY = Math.cos(this.time * blob.speedY + index) * 30;
        
        // Morphing shape using scale
        const morphX = 1 + Math.sin(this.time * blob.morphSpeed + blob.morphOffset) * 0.2;
        const morphY = 1 + Math.cos(this.time * blob.morphSpeed + blob.morphOffset) * 0.2;

        blob.element.style.transform = `
          translate(${blob.x + moveX}%, ${blob.y + moveY}%)
          scale(${morphX}, ${morphY})
        `;
      });

      this.animationId = requestAnimationFrame(() => this.animate());
    }

    pause() {
      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
        this.animationId = null;
      }
    }

    play() {
      if (!this.animationId) {
        this.animate();
      }
    }

    destroy() {
      this.pause();
      this.blobContainer?.remove();
    }

    randomBetween(min, max) {
      return Math.random() * (max - min) + min;
    }
  }

  // ==========================================================================
  // WAVE ANIMATION
  // SVG wave effect for section dividers and backgrounds
  // ==========================================================================

  class WaveAnimation {
    constructor(container, options = {}) {
      this.container = typeof container === 'string' 
        ? document.querySelector(container) 
        : container;
      
      if (!this.container) return;

      this.options = { ...CONFIG.wave, ...options };
      this.animationId = null;
      this.phase = 0;

      this.init();
    }

    init() {
      // Create SVG
      this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      this.svg.setAttribute('class', 'liquid-wave');
      this.svg.setAttribute('viewBox', '0 0 1440 320');
      this.svg.setAttribute('preserveAspectRatio', 'none');
      this.svg.setAttribute('aria-hidden', 'true');
      this.svg.style.cssText = `
        width: 100%;
        height: 100%;
        display: block;
      `;

      // Create wave paths
      this.paths = [];
      const colors = [
        'var(--color-primary, #1a1a1a)',
        'var(--color-secondary, #333)',
        'var(--color-surface, #f5f5f5)'
      ];

      for (let i = 0; i < this.options.layers; i++) {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('fill', colors[i % colors.length]);
        path.style.opacity = 1 - (i * 0.2);
        this.paths.push(path);
        this.svg.appendChild(path);
      }

      this.container.appendChild(this.svg);

      // Start animation if not reduced motion
      if (!CONFIG.reducedMotion) {
        this.animate();
      } else {
        // Static wave
        this.updatePaths(0);
      }
    }

    generateWavePath(offset) {
      const { amplitude, frequency } = this.options;
      let d = 'M0,160';
      
      for (let x = 0; x <= 1440; x += 20) {
        const y = 160 + Math.sin(x * frequency + offset) * amplitude;
        d += ` L${x},${y}`;
      }
      
      d += ' L1440,320 L0,320 Z';
      return d;
    }

    updatePaths(phase) {
      this.paths.forEach((path, index) => {
        const offset = phase + (index * Math.PI / 3);
        path.setAttribute('d', this.generateWavePath(offset));
      });
    }

    animate() {
      this.phase += this.options.speed;
      this.updatePaths(this.phase);
      this.animationId = requestAnimationFrame(() => this.animate());
    }

    pause() {
      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
        this.animationId = null;
      }
    }

    destroy() {
      this.pause();
      this.svg?.remove();
    }
  }

  // ==========================================================================
  // RIPPLE EFFECT
  // Water ripple on click/tap interactions
  // ==========================================================================

  class RippleEffect {
    constructor(selector = '[data-ripple]') {
      if (CONFIG.reducedMotion) return;
      
      this.selector = selector;
      this.init();
    }

    init() {
      document.addEventListener('click', (e) => {
        const target = e.target.closest(this.selector);
        if (!target) return;
        
        this.createRipple(e, target);
      });
    }

    createRipple(event, element) {
      const rect = element.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const ripple = document.createElement('span');
      ripple.className = 'liquid-ripple';
      ripple.style.cssText = `
        position: absolute;
        left: ${x}px;
        top: ${y}px;
        width: 0;
        height: 0;
        border-radius: 50%;
        background: rgba(${CONFIG.ripple.color}, 0.2);
        transform: translate(-50%, -50%);
        pointer-events: none;
        animation: liquid-ripple-expand ${CONFIG.ripple.duration}ms ease-out forwards;
      `;

      // Ensure parent has position
      const computedStyle = window.getComputedStyle(element);
      if (computedStyle.position === 'static') {
        element.style.position = 'relative';
      }
      element.style.overflow = 'hidden';

      element.appendChild(ripple);

      // Cleanup
      setTimeout(() => ripple.remove(), CONFIG.ripple.duration);
    }
  }

  // ==========================================================================
  // LIQUID HOVER EFFECT
  // Fluid deformation on hover for images and cards
  // ==========================================================================

  class LiquidHover {
    constructor(selector = '[data-liquid-hover]') {
      if (CONFIG.reducedMotion) return;

      this.elements = document.querySelectorAll(selector);
      if (!this.elements.length) return;

      this.init();
    }

    init() {
      this.elements.forEach(element => {
        element.style.transition = 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)';
        element.style.willChange = 'transform';

        element.addEventListener('mouseenter', (e) => this.onEnter(e, element));
        element.addEventListener('mousemove', (e) => this.onMove(e, element));
        element.addEventListener('mouseleave', (e) => this.onLeave(e, element));
      });
    }

    onEnter(e, element) {
      element.style.transition = 'none';
    }

    onMove(e, element) {
      const rect = element.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      
      // Calculate rotation based on mouse position
      const rotateX = (y - 0.5) * -10;
      const rotateY = (x - 0.5) * 10;
      
      element.style.transform = `
        perspective(1000px)
        rotateX(${rotateX}deg)
        rotateY(${rotateY}deg)
        scale3d(1.02, 1.02, 1.02)
      `;
    }

    onLeave(e, element) {
      element.style.transition = 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)';
      element.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
    }
  }

  // ==========================================================================
  // LIQUID TEXT REVEAL
  // Water-like text reveal animation
  // ==========================================================================

  class LiquidTextReveal {
    constructor(selector = '[data-liquid-text]') {
      if (CONFIG.reducedMotion) return;

      this.elements = document.querySelectorAll(selector);
      if (!this.elements.length) return;

      this.init();
    }

    init() {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.revealText(entry.target);
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.2 });

      this.elements.forEach(element => {
        // Wrap each character
        const text = element.textContent;
        element.innerHTML = '';
        element.setAttribute('aria-label', text);
        
        text.split('').forEach((char, index) => {
          const span = document.createElement('span');
          span.textContent = char === ' ' ? '\u00A0' : char;
          span.className = 'liquid-char';
          span.style.cssText = `
            display: inline-block;
            opacity: 0;
            transform: translateY(100%) rotateX(-90deg);
            transform-origin: center bottom;
            transition: opacity 0.4s ease, transform 0.6s cubic-bezier(0.19, 1, 0.22, 1);
            transition-delay: ${index * 30}ms;
          `;
          span.setAttribute('aria-hidden', 'true');
          element.appendChild(span);
        });

        observer.observe(element);
      });
    }

    revealText(element) {
      element.querySelectorAll('.liquid-char').forEach(char => {
        char.style.opacity = '1';
        char.style.transform = 'translateY(0) rotateX(0)';
      });
    }
  }

  // ==========================================================================
  // LIQUID CURSOR
  // Fluid cursor trail effect
  // ==========================================================================

  class LiquidCursor {
    constructor(options = {}) {
      if (CONFIG.reducedMotion || !window.matchMedia('(hover: hover)').matches) return;
      
      if (!document.querySelector('[data-liquid-cursor]')) return;

      this.options = {
        trailLength: 10,
        size: 20,
        color: 'var(--color-primary, #1a1a1a)',
        ...options
      };

      this.trail = [];
      this.mouseX = 0;
      this.mouseY = 0;

      this.init();
    }

    init() {
      // Create cursor elements
      this.cursor = document.createElement('div');
      this.cursor.className = 'liquid-cursor';
      this.cursor.setAttribute('aria-hidden', 'true');
      this.cursor.style.cssText = `
        position: fixed;
        width: ${this.options.size}px;
        height: ${this.options.size}px;
        background: ${this.options.color};
        border-radius: 50%;
        pointer-events: none;
        z-index: 9999;
        opacity: 0.5;
        mix-blend-mode: difference;
        transform: translate(-50%, -50%);
        transition: transform 0.1s ease-out;
      `;
      document.body.appendChild(this.cursor);

      // Create trail
      for (let i = 0; i < this.options.trailLength; i++) {
        const dot = document.createElement('div');
        dot.className = 'liquid-cursor-trail';
        dot.style.cssText = `
          position: fixed;
          width: ${this.options.size - i * 1.5}px;
          height: ${this.options.size - i * 1.5}px;
          background: ${this.options.color};
          border-radius: 50%;
          pointer-events: none;
          z-index: 9998;
          opacity: ${0.3 - i * 0.02};
          mix-blend-mode: difference;
          transform: translate(-50%, -50%);
        `;
        this.trail.push({ element: dot, x: 0, y: 0 });
        document.body.appendChild(dot);
      }

      // Track mouse
      document.addEventListener('mousemove', (e) => {
        this.mouseX = e.clientX;
        this.mouseY = e.clientY;
      });

      // Hide on touch devices
      document.addEventListener('touchstart', () => {
        this.cursor.style.display = 'none';
        this.trail.forEach(dot => dot.element.style.display = 'none');
      }, { once: true });

      this.animate();
    }

    animate() {
      // Update cursor
      this.cursor.style.left = `${this.mouseX}px`;
      this.cursor.style.top = `${this.mouseY}px`;

      // Update trail with delay
      this.trail.forEach((dot, index) => {
        const prevDot = index === 0 
          ? { x: this.mouseX, y: this.mouseY }
          : this.trail[index - 1];

        dot.x += (prevDot.x - dot.x) * 0.3;
        dot.y += (prevDot.y - dot.y) * 0.3;

        dot.element.style.left = `${dot.x}px`;
        dot.element.style.top = `${dot.y}px`;
      });

      requestAnimationFrame(() => this.animate());
    }
  }

  // ==========================================================================
  // DROPLET ANIMATION
  // Falling droplet effect for loading states
  // ==========================================================================

  class DropletLoader {
    constructor(container) {
      this.container = typeof container === 'string' 
        ? document.querySelector(container) 
        : container;

      if (!this.container) return;

      this.init();
    }

    init() {
      this.element = document.createElement('div');
      this.element.className = 'liquid-droplet-loader';
      this.element.setAttribute('role', 'status');
      this.element.setAttribute('aria-label', 'Loading');
      this.element.innerHTML = `
        <div class="droplet"></div>
        <div class="droplet"></div>
        <div class="droplet"></div>
      `;
      this.container.appendChild(this.element);
    }

    show() {
      this.element.style.display = 'flex';
    }

    hide() {
      this.element.style.display = 'none';
    }

    destroy() {
      this.element?.remove();
    }
  }

  // ==========================================================================
  // INJECT REQUIRED CSS
  // ==========================================================================

  function injectStyles() {
    const styles = document.createElement('style');
    styles.id = 'liquid-effects-styles';
    styles.textContent = `
      /* Liquid Blobs Container */
      .liquid-blobs {
        position: absolute;
        inset: 0;
        overflow: hidden;
        pointer-events: none;
        z-index: 0;
      }

      /* Wave Section */
      .liquid-wave-section {
        position: relative;
        width: 100%;
        height: 150px;
      }

      /* Ripple Animation */
      @keyframes liquid-ripple-expand {
        to {
          width: ${CONFIG.ripple.maxRadius * 2}px;
          height: ${CONFIG.ripple.maxRadius * 2}px;
          opacity: 0;
        }
      }

      /* Droplet Loader */
      .liquid-droplet-loader {
        display: flex;
        gap: 8px;
        align-items: flex-end;
        justify-content: center;
        padding: 20px;
      }

      .liquid-droplet-loader .droplet {
        width: 12px;
        height: 12px;
        background: var(--color-primary, #1a1a1a);
        border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
        animation: droplet-fall 1.2s ease-in-out infinite;
      }

      .liquid-droplet-loader .droplet:nth-child(2) {
        animation-delay: 0.2s;
      }

      .liquid-droplet-loader .droplet:nth-child(3) {
        animation-delay: 0.4s;
      }

      @keyframes droplet-fall {
        0%, 100% {
          transform: translateY(0) scale(1);
          opacity: 1;
        }
        50% {
          transform: translateY(-20px) scale(0.8);
          opacity: 0.5;
        }
      }

      /* Water Surface Effect */
      .liquid-surface {
        position: relative;
        overflow: hidden;
      }

      .liquid-surface::after {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(
          to bottom,
          transparent 0%,
          rgba(255, 255, 255, 0.1) 50%,
          transparent 100%
        );
        animation: liquid-surface-shimmer 3s ease-in-out infinite;
        pointer-events: none;
      }

      @keyframes liquid-surface-shimmer {
        0%, 100% {
          transform: translateY(-100%);
        }
        50% {
          transform: translateY(100%);
        }
      }

      /* Bubble Effect */
      .liquid-bubbles {
        position: absolute;
        inset: 0;
        overflow: hidden;
        pointer-events: none;
      }

      .liquid-bubble {
        position: absolute;
        bottom: -20px;
        background: radial-gradient(
          circle at 30% 30%,
          rgba(255, 255, 255, 0.8) 0%,
          rgba(255, 255, 255, 0.4) 50%,
          transparent 100%
        );
        border-radius: 50%;
        animation: bubble-rise linear infinite;
      }

      @keyframes bubble-rise {
        0% {
          transform: translateY(0) scale(1);
          opacity: 0.7;
        }
        100% {
          transform: translateY(-100vh) scale(0.5);
          opacity: 0;
        }
      }

      /* Reduced Motion */
      @media (prefers-reduced-motion: reduce) {
        .liquid-blob,
        .liquid-wave path,
        .liquid-cursor,
        .liquid-cursor-trail,
        .liquid-droplet-loader .droplet,
        .liquid-surface::after,
        .liquid-bubble {
          animation: none !important;
          transition: none !important;
        }

        .liquid-blobs,
        .liquid-cursor,
        .liquid-cursor-trail {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(styles);
  }

  // ==========================================================================
  // BUBBLE EFFECT
  // Rising bubbles for background decoration
  // ==========================================================================

  class BubbleEffect {
    constructor(container, options = {}) {
      this.container = typeof container === 'string' 
        ? document.querySelector(container) 
        : container;

      if (!this.container || CONFIG.reducedMotion) return;

      this.options = {
        count: 15,
        minSize: 5,
        maxSize: 20,
        minDuration: 5,
        maxDuration: 12,
        ...options
      };

      this.init();
    }

    init() {
      this.bubbleContainer = document.createElement('div');
      this.bubbleContainer.className = 'liquid-bubbles';
      this.bubbleContainer.setAttribute('aria-hidden', 'true');
      this.container.style.position = 'relative';
      this.container.appendChild(this.bubbleContainer);

      this.createBubbles();
    }

    createBubbles() {
      for (let i = 0; i < this.options.count; i++) {
        this.createBubble();
      }
    }

    createBubble() {
      const bubble = document.createElement('div');
      const size = Math.random() * (this.options.maxSize - this.options.minSize) + this.options.minSize;
      const duration = Math.random() * (this.options.maxDuration - this.options.minDuration) + this.options.minDuration;
      const left = Math.random() * 100;
      const delay = Math.random() * duration;

      bubble.className = 'liquid-bubble';
      bubble.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        left: ${left}%;
        animation-duration: ${duration}s;
        animation-delay: ${delay}s;
      `;

      this.bubbleContainer.appendChild(bubble);
    }

    destroy() {
      this.bubbleContainer?.remove();
    }
  }

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================

  function init() {
    // Inject styles
    if (!document.getElementById('liquid-effects-styles')) {
      injectStyles();
    }

    // Initialize components
    new RippleEffect();
    new LiquidHover();
    new LiquidTextReveal();
    new LiquidCursor();

    // Auto-initialize blob backgrounds
    document.querySelectorAll('[data-liquid-blob]').forEach(el => {
      new BlobAnimation(el);
    });

    // Auto-initialize wave sections
    document.querySelectorAll('[data-liquid-wave]').forEach(el => {
      new WaveAnimation(el);
    });

    // Auto-initialize bubble effects
    document.querySelectorAll('[data-liquid-bubbles]').forEach(el => {
      new BubbleEffect(el);
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose to global scope
  window.LiquidEffects = {
    BlobAnimation,
    WaveAnimation,
    RippleEffect,
    LiquidHover,
    LiquidTextReveal,
    LiquidCursor,
    DropletLoader,
    BubbleEffect,
    CONFIG
  };

})();
