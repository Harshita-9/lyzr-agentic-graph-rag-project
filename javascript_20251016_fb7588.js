export class MetricsCollector {
  constructor() {
    this.retrievalMetrics = new Map();
    this.performanceMetrics = [];
  }

  recordRetrieval(query, strategy, latency, confidence, documentCount) {
    const metric = {
      timestamp: new Date().toISOString(),
      query,
      strategy,
      latency,
      confidence,
      documentCount,
      success: confidence > 0.3
    };
    
    this.performanceMetrics.push(metric);
    
    // Update strategy statistics
    if (!this.retrievalMetrics.has(strategy)) {
      this.retrievalMetrics.set(strategy, { count: 0, totalLatency: 0, successCount: 0 });
    }
    
    const stats = this.retrievalMetrics.get(strategy);
    stats.count++;
    stats.totalLatency += latency;
    if (confidence > 0.5) stats.successCount++;
  }

  getStrategyEffectiveness() {
    const effectiveness = {};
    
    for (const [strategy, stats] of this.retrievalMetrics) {
      effectiveness[strategy] = {
        usageCount: stats.count,
        averageLatency: stats.totalLatency / stats.count,
        successRate: (stats.successCount / stats.count) * 100
      };
    }
    
    return effectiveness;
  }

  getPerformanceReport() {
    const recentMetrics = this.performanceMetrics.slice(-100);
    const averageLatency = recentMetrics.reduce((sum, m) => sum + m.latency, 0) / recentMetrics.length;
    const successRate = (recentMetrics.filter(m => m.success).length / recentMetrics.length) * 100;
    
    return {
      totalQueries: this.performanceMetrics.length,
      averageLatency,
      successRate,
      strategyDistribution: this.getStrategyEffectiveness(),
      recentPerformance: recentMetrics
    };
  }
}