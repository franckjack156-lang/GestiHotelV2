/**
 * ============================================================================
 * PERFORMANCE MONITORING UTILITIES
 * ============================================================================
 *
 * Utilitaires pour mesurer et tracker les performances de l'application
 * - Web Vitals (FCP, LCP, CLS, FID, TTFB)
 * - Custom performance metrics
 * - Performance marks & measures
 */

import { trackPerformanceMetric } from '@/core/config/analytics';

/**
 * Type pour les Web Vitals
 */
export interface WebVitalMetric {
  id: string;
  name: 'FCP' | 'LCP' | 'CLS' | 'FID' | 'TTFB' | 'INP';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  navigationType: string;
}

/**
 * Initialise le monitoring des Web Vitals
 * Utilise l'API web-vitals si disponible
 */
export const initWebVitals = async () => {
  if (import.meta.env.DEV) {
    console.log('🔧 Web Vitals tracking disabled in development mode');
    return;
  }

  try {
    // Import dynamique de web-vitals (v4+ n'a plus onFID, utilise onINP à la place)
    const { onCLS, onFCP, onLCP, onTTFB, onINP } = await import('web-vitals');

    // Handler pour envoyer les métriques
    const sendToAnalytics = (metric: any) => {
      // Track dans Google Analytics
      trackPerformanceMetric(metric.name, metric.value);

      // Log en développement
      if (import.meta.env.DEV) {
        console.log(`📊 ${metric.name}:`, {
          value: metric.value,
          rating: metric.rating,
        });
      }
    };

    // Écouter toutes les métriques (web-vitals v4+ utilise INP au lieu de FID)
    onCLS(sendToAnalytics);
    onFCP(sendToAnalytics);
    onLCP(sendToAnalytics);
    onTTFB(sendToAnalytics);
    onINP(sendToAnalytics);

    console.log('✅ Web Vitals monitoring initialized');
  } catch (error) {
    console.warn('⚠️ Web Vitals library not available:', error);
  }
};

/**
 * Crée une marque de performance
 */
export const performanceMark = (name: string) => {
  if (typeof performance !== 'undefined' && performance.mark) {
    performance.mark(name);
  }
};

/**
 * Mesure le temps entre deux marques
 */
export const performanceMeasure = (
  name: string,
  startMark: string,
  endMark: string
): number | null => {
  if (typeof performance === 'undefined' || !performance.measure) {
    return null;
  }

  try {
    performance.measure(name, startMark, endMark);
    const measure = performance.getEntriesByName(name)[0] as PerformanceMeasure;

    // Track la mesure
    trackPerformanceMetric(name, measure.duration);

    // Log en développement
    if (import.meta.env.DEV) {
      console.log(`⏱️ ${name}: ${measure.duration.toFixed(2)}ms`);
    }

    return measure.duration;
  } catch (error) {
    console.warn(`Failed to measure ${name}:`, error);
    return null;
  }
};

/**
 * Hook pour mesurer le temps de rendu d'un composant
 */
export const measureComponentRender = (componentName: string) => {
  const startTime = performance.now();

  return () => {
    const duration = performance.now() - startTime;
    trackPerformanceMetric(`component_render_${componentName}`, duration);

    if (import.meta.env.DEV && duration > 16) {
      // Warn si > 16ms (1 frame à 60fps)
      console.warn(`⚠️ Slow component render: ${componentName} took ${duration.toFixed(2)}ms`);
    }
  };
};

/**
 * Mesure le temps d'une opération asynchrone
 */
export const measureAsync = async <T>(
  name: string,
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> => {
  const startMark = `${name}_start`;
  const endMark = `${name}_end`;

  performanceMark(startMark);

  try {
    const result = await fn();
    performanceMark(endMark);

    const duration = performanceMeasure(name, startMark, endMark) || 0;

    return { result, duration };
  } catch (error) {
    performanceMark(endMark);
    throw error;
  }
};

/**
 * Observe les ressources chargées (images, fonts, etc.)
 */
export const observeResourceLoading = () => {
  if (typeof PerformanceObserver === 'undefined') {
    return;
  }

  const observer = new PerformanceObserver(list => {
    for (const entry of list.getEntries()) {
      const resourceEntry = entry as PerformanceResourceTiming;

      // Track les ressources lentes (> 1s)
      if (resourceEntry.duration > 1000) {
        trackPerformanceMetric('slow_resource_load', resourceEntry.duration);

        if (import.meta.env.DEV) {
          console.warn('🐌 Slow resource:', {
            name: resourceEntry.name,
            duration: resourceEntry.duration,
            size: resourceEntry.transferSize,
          });
        }
      }
    }
  });

  observer.observe({ entryTypes: ['resource'] });
};

/**
 * Monitore les long tasks (> 50ms)
 */
export const observeLongTasks = () => {
  if (typeof PerformanceObserver === 'undefined') {
    return;
  }

  try {
    const observer = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        const longTaskEntry = entry as PerformanceEntry;

        trackPerformanceMetric('long_task', longTaskEntry.duration);

        if (import.meta.env.DEV) {
          console.warn('⚠️ Long task detected:', {
            duration: longTaskEntry.duration,
            startTime: longTaskEntry.startTime,
          });
        }
      }
    });

    observer.observe({ entryTypes: ['longtask'] });
  } catch (error) {
    // PerformanceLongTaskTiming might not be supported
    console.warn('Long task monitoring not supported');
  }
};

/**
 * Récupère les métriques de navigation
 */
export const getNavigationMetrics = (): Record<string, number> | null => {
  if (typeof performance === 'undefined' || !performance.getEntriesByType) {
    return null;
  }

  const [navigation] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];

  if (!navigation) {
    return null;
  }

  return {
    dnsLookup: navigation.domainLookupEnd - navigation.domainLookupStart,
    tcpConnection: navigation.connectEnd - navigation.connectStart,
    tlsNegotiation: navigation.secureConnectionStart
      ? navigation.connectEnd - navigation.secureConnectionStart
      : 0,
    timeToFirstByte: navigation.responseStart - navigation.requestStart,
    responseTime: navigation.responseEnd - navigation.responseStart,
    domParsing: navigation.domComplete - navigation.domInteractive,
    domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
    pageLoad: navigation.loadEventEnd - navigation.loadEventStart,
    totalTime: navigation.loadEventEnd - navigation.fetchStart,
  };
};

/**
 * Initialise tous les observateurs de performance
 */
export const initPerformanceMonitoring = () => {
  // Web Vitals
  initWebVitals();

  // Resource loading
  observeResourceLoading();

  // Long tasks
  observeLongTasks();

  // Log navigation metrics en développement
  if (import.meta.env.DEV) {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const metrics = getNavigationMetrics();
        if (metrics) {
          console.log('📊 Navigation Metrics:', metrics);
        }
      }, 0);
    });
  }
};
