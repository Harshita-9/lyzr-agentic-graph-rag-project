import { RetrievalOrchestrator } from '../../src/agents/RetrievalOrchestrator.js';
import { describe, it, expect, beforeEach } from '@jest/globals';

describe('RetrievalOrchestrator', () => {
  let orchestrator;

  beforeEach(() => {
    orchestrator = new RetrievalOrchestrator();
  });

  it('should process semantic queries efficiently', async () => {
    const query = "Find documents about machine learning algorithms";
    const result = await orchestrator.processQuery(query);
    
    expect(result).toHaveProperty('queryAnalysis');
    expect(result).toHaveProperty('strategy');
    expect(result.results).toHaveProperty('answer');
    expect(result.results).toHaveProperty('supportingDocuments');
  });

  it('should handle complex multi-hop queries', async () => {
    const query = "How are transformer architectures related to attention mechanisms in NLP?";
    const result = await orchestrator.processQuery(query);
    
    expect(result.strategy).toBe('complex');
    expect(result.results.retrievalMetadata.documentCount).toBeGreaterThan(0);
  });

  it('should provide confidence scores', async () => {
    const query = "Simple factual query";
    const result = await orchestrator.processQuery(query);
    
    expect(result.results.retrievalMetadata.confidence).toBeGreaterThan(0);
    expect(result.results.retrievalMetadata.confidence).toBeLessThanOrEqual(1);
  });
});