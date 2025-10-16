import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { RetrievalOrchestrator } from '../../src/agents/RetrievalOrchestrator.js';

// Mock dependencies
jest.mock('../../src/agents/VectorRetrievalAgent.js', () => {
  return {
    VectorRetrievalAgent: jest.fn().mockImplementation(() => ({
      retrieve: jest.fn().mockResolvedValue({
        documents: [
          { id: 'vec1', content: 'Vector result 1', score: 0.9 },
          { id: 'vec2', content: 'Vector result 2', score: 0.8 }
        ],
        agentStrategy: 'semantic',
        latency: 150,
        confidence: 0.85
      })
    }))
  };
});

jest.mock('../../src/agents/GraphTraversalAgent.js', () => {
  return {
    GraphTraversalAgent: jest.fn().mockImplementation(() => ({
      retrieve: jest.fn().mockResolvedValue({
        documents: [
          { id: 'graph1', content: 'Graph result 1', score: 0.95 },
          { id: 'graph2', content: 'Graph result 2', score: 0.75 }
        ],
        agentStrategy: 'relational',
        latency: 200,
        confidence: 0.9
      })
    }))
  };
});

jest.mock('../../src/agents/LogicalFilteringAgent.js', () => {
  return {
    LogicalFilteringAgent: jest.fn().mockImplementation(() => ({
      retrieve: jest.fn().mockResolvedValue({
        documents: [
          { id: 'logical1', content: 'Logical result 1', score: 0.88 }
        ],
        agentStrategy: 'factual',
        latency: 100,
        confidence: 0.8
      })
    }))
  };
});

jest.mock('../../src/agents/QueryAnalyzer.js', () => {
  return {
    QueryAnalyzer: jest.fn().mockImplementation(() => ({
      analyze: jest.fn().mockResolvedValue({
        intent: ['semantic', 'relational'],
        complexity: 'medium',
        domain: 'technology',
        entities: ['AI', 'Machine Learning'],
        relationships: ['uses', 'subset_of'],
        requiredReasoning: ['multi_hop'],
        expectedAnswerType: 'explanation',
        ambiguityLevel: 'low',
        contextRequirements: ['technical_knowledge']
      })
    }))
  };
});

describe('RetrievalOrchestrator Integration', () => {
  let orchestrator;

  beforeEach(() => {
    orchestrator = new RetrievalOrchestrator();
  });

  describe('processQuery', () => {
    it('should process simple semantic queries', async () => {
      const query = "What is machine learning?";
      
      const result = await orchestrator.processQuery(query);

      expect(result).toHaveProperty('queryAnalysis');
      expect(result).toHaveProperty('strategy');
      expect(result).toHaveProperty('results');
      expect(result.results).toHaveProperty('answer');
      expect(result.results).toHaveProperty('supportingDocuments');
      expect(result.results.retrievalMetadata.confidence).toBeGreaterThan(0);
    });

    it('should handle complex multi-hop queries with hybrid strategy', async () => {
      const query = "How are transformers related to attention mechanisms in NLP?";
      
      const result = await orchestrator.processQuery(query);

      expect(result.strategy).toBe('complex');
      expect(result.results.supportingDocuments.length).toBeGreaterThan(0);
      expect(result.reasoningChain).toBeDefined();
    });

    it('should provide confidence scores for results', async () => {
      const query = "Simple factual query";
      
      const result = await orchestrator.processQuery(query);

      expect(result.results.retrievalMetadata.confidence).toBeGreaterThan(0);
      expect(result.results.retrievalMetadata.confidence).toBeLessThanOrEqual(1);
    });

    it('should handle query analysis failures gracefully', async () => {
      // Mock query analyzer to throw error
      orchestrator.queryAnalyzer.analyze = jest.fn().mockRejectedValue(new Error('Analysis failed'));
      
      const query = "Test query";
      
      await expect(orchestrator.processQuery(query)).rejects.toThrow();
    });
  });

  describe('strategy selection', () => {
    it('should select hybrid strategy for complex queries', async () => {
      const complexQuery = "Compare and contrast supervised vs unsupervised learning in AI systems";
      
      const result = await orchestrator.processQuery(complexQuery);
      
      expect(result.strategy).toBe('complex');
    });

    it('should select semantic strategy for similarity queries', async () => {
      // Mock query analysis for semantic intent
      orchestrator.queryAnalyzer.analyze = jest.fn().mockResolvedValue({
        intent: ['semantic'],
        complexity: 'low',
        requiredReasoning: ['direct']
      });
      
      const query = "Find documents similar to neural networks";
      const result = await orchestrator.processQuery(query);
      
      expect(result.strategy).toBe('semantic');
    });
  });

  describe('result fusion', () => {
    it('should fuse results from multiple strategies', async () => {
      const query = "Complex query requiring multiple approaches";
      
      const result = await orchestrator.processQuery(query);
      
      // Should have documents from multiple sources
      const sources = new Set(result.results.supportingDocuments.map(doc => doc.metadata?.type));
      expect(sources.size).toBeGreaterThan(1);
    });

    it('should rank fused results by combined score', async () => {
      const query = "Test ranking query";
      
      const result = await orchestrator.processQuery(query);
      const documents = result.results.supportingDocuments;
      
      // Check if documents are sorted by score (descending)
      for (let i = 1; i < documents.length; i++) {
        expect(documents[i-1].score).toBeGreaterThanOrEqual(documents[i].score);
      }
    });
  });
});