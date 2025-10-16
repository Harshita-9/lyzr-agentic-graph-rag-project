import { VectorRetrievalAgent } from './VectorRetrievalAgent.js';
import { GraphTraversalAgent } from './GraphTraversalAgent.js';
import { LogicalFilteringAgent } from './LogicalFilteringAgent.js';
import { QueryAnalyzer } from './QueryAnalyzer.js';

export class RetrievalOrchestrator {
  constructor() {
    this.vectorAgent = new VectorRetrievalAgent();
    this.graphAgent = new GraphTraversalAgent();
    this.filterAgent = new LogicalFilteringAgent();
    this.queryAnalyzer = new QueryAnalyzer();
    
    this.retrievalStrategies = new Map([
      ['semantic', this.vectorAgent],
      ['relational', this.graphAgent],
      ['factual', this.filterAgent],
      ['complex', this.executeHybridRetrieval.bind(this)]
    ]);
  }

  async processQuery(userQuery, context = {}) {
    console.log('🤖 Processing query with agentic retrieval:', userQuery);
    
    // Step 1: Analyze query intent and complexity
    const queryAnalysis = await this.queryAnalyzer.analyze(userQuery);
    
    // Step 2: Select optimal retrieval strategy
    const strategy = this.selectRetrievalStrategy(queryAnalysis);
    
    // Step 3: Execute retrieval with agentic reasoning
    const results = await this.executeAgenticRetrieval(strategy, userQuery, queryAnalysis, context);
    
    // Step 4: Synthesize and rank results
    const synthesized = await this.synthesizeResults(results, userQuery);
    
    return {
      queryAnalysis,
      strategy,
      results: synthesized,
      reasoningChain: results.reasoningChain
    };
  }

  selectRetrievalStrategy(queryAnalysis) {
    const { intent, complexity, requiredReasoning } = queryAnalysis;
    
    if (complexity === 'high' || requiredReasoning.includes('multi_hop')) {
      return 'complex';
    }
    
    if (intent.includes('semantic') || intent.includes('similar')) {
      return 'semantic';
    }
    
    if (intent.includes('relational') || intent.includes('connection')) {
      return 'relational';
    }
    
    if (intent.includes('factual') || intent.includes('filter')) {
      return 'factual';
    }
    
    return 'complex'; // Default to hybrid for robustness
  }

  async executeAgenticRetrieval(strategy, query, analysis, context) {
    const agent = this.retrievalStrategies.get(strategy);
    
    if (!agent) {
      throw new Error(`Unknown retrieval strategy: ${strategy}`);
    }
    
    const results = await agent.retrieve(query, analysis, context);
    
    // Add agentic reasoning metadata
    return {
      ...results,
      agentStrategy: strategy,
      confidence: this.calculateConfidence(results, analysis),
      reasoningChain: await this.generateReasoningChain(query, strategy, results)
    };
  }

  async executeHybridRetrieval(query, analysis, context) {
    console.log('🔄 Executing hybrid retrieval strategy');
    
    // Execute all strategies in parallel
    const [semanticResults, graphResults, filterResults] = await Promise.all([
      this.vectorAgent.retrieve(query, analysis, context),
      this.graphAgent.retrieve(query, analysis, context),
      this.filterAgent.retrieve(query, analysis, context)
    ]);
    
    // Agentic fusion of results
    const fusedResults = await this.fuseResults([
      semanticResults,
      graphResults,
      filterResults
    ], query);
    
    return fusedResults;
  }

  async fuseResults(resultsSets, query) {
    // Advanced fusion algorithm with agentic reasoning
    const weightedResults = resultsSets.map((result, index) => ({
      ...result,
      weight: this.calculateStrategyWeight(result, query, index)
    }));
    
    // Combine and re-rank
    const combined = [].concat(...weightedResults.map(r => 
      r.documents.map(doc => ({
        ...doc,
        combinedScore: doc.score * r.weight,
        source: r.agentStrategy
      }))
    ));
    
    combined.sort((a, b) => b.combinedScore - a.combinedScore);
    
    return {
      documents: combined.slice(0, 10),
      fusionMethod: 'weighted_hybrid',
      strategyWeights: weightedResults.reduce((acc, r) => ({
        ...acc,
        [r.agentStrategy]: r.weight
      }), {})
    };
  }

  calculateStrategyWeight(results, query, strategyIndex) {
    // Dynamic weighting based on result quality and query type
    const baseWeights = { semantic: 0.4, relational: 0.35, factual: 0.25 };
    const confidenceBoost = results.confidence * 0.3;
    
    return baseWeights[results.agentStrategy] + confidenceBoost;
  }

  async synthesizeResults(results, originalQuery) {
    // LLM-powered synthesis of multiple retrieval results
    const synthesisPrompt = `Synthesize these retrieved documents into a coherent answer for the query: "${originalQuery}"
    
    Retrieved Documents: ${JSON.stringify(results.documents.slice(0, 5), null, 2)}
    
    Provide a comprehensive, accurate answer citing relevant sources.`;
    
    // Use LLM for final answer synthesis
    const synthesizedAnswer = await this.callSynthesisLLM(synthesisPrompt);
    
    return {
      answer: synthesizedAnswer,
      supportingDocuments: results.documents,
      retrievalMetadata: {
        strategy: results.agentStrategy,
        confidence: results.confidence,
        documentCount: results.documents.length
      }
    };
  }

  async generateReasoningChain(query, strategy, results) {
    return {
      steps: [
        `Analyzed query: "${query}"`,
        `Selected strategy: ${strategy}`,
        `Retrieved ${results.documents?.length || 0} documents`,
        `Confidence: ${(results.confidence * 100).toFixed(1)}%`
      ],
      finalDecision: `Used ${strategy} retrieval based on query analysis`
    };
  }

  calculateConfidence(results, analysis) {
    const baseConfidence = results.documents?.length > 0 ? 0.7 : 0.3;
    const complexityPenalty = analysis.complexity === 'high' ? -0.1 : 0;
    const diversityBonus = this.calculateDiversityBonus(results.documents);
    
    return Math.max(0, Math.min(1, baseConfidence + complexityPenalty + diversityBonus));
  }

  calculateDiversityBonus(documents) {
    if (!documents || documents.length < 2) return 0;
    
    const sources = new Set(documents.map(d => d.source));
    return (sources.size - 1) * 0.1;
  }
}