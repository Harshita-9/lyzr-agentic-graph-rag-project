import { OpenAI } from 'openai';
import ConfigManager from '../core/ConfigManager.js';

export class QueryAnalyzer {
  constructor() {
    this.openai = new OpenAI({ apiKey: ConfigManager.ai.openai.apiKey });
    this.analysisCache = new Map();
  }

  async analyze(query) {
    // Check cache first
    const cacheKey = this.generateCacheKey(query);
    if (this.analysisCache.has(cacheKey)) {
      return this.analysisCache.get(cacheKey);
    }
    
    console.log('🔍 Analyzing query:', query);
    
    try {
      const analysis = await this.performDeepAnalysis(query);
      this.analysisCache.set(cacheKey, analysis);
      
      // Cache cleanup
      if (this.analysisCache.size > 1000) {
        const firstKey = this.analysisCache.keys().next().value;
        this.analysisCache.delete(firstKey);
      }
      
      return analysis;
    } catch (error) {
      console.error('Query analysis failed:', error);
      return this.getDefaultAnalysis(query);
    }
  }

  async performDeepAnalysis(query) {
    const analysisPrompt = `Perform comprehensive analysis of this search query:
    
    Query: "${query}"
    
    Analyze and return JSON with:
    - intent: primary search intent (semantic, relational, factual, exploratory)
    - complexity: low/medium/high based on reasoning requirements
    - domain: inferred domain/topic
    - entities: mentioned entities/concepts
    - relationships: implied relationships to explore
    - requiredReasoning: types needed (multi_hop, comparative, causal, temporal)
    - expectedAnswerType: fact, explanation, list, comparison
    - ambiguityLevel: low/medium/high
    - contextRequirements: what context is needed
    
    Be precise and analytical.`;
    
    const completion = await this.openai.chat.completions.create({
      model: ConfigManager.ai.openai.model,
      messages: [{ role: "user", content: analysisPrompt }],
      temperature: 0.1,
      max_tokens: 800
    });
    
    const analysis = JSON.parse(completion.choices[0].message.content);
    
    // Enhance with additional metadata
    return {
      ...analysis,
      queryLength: query.length,
      wordCount: query.split(/\s+/).length,
      hasQuestionWords: this.hasQuestionWords(query),
      containsTemporalReferences: this.containsTemporalReferences(query),
      containsNumericalData: this.containsNumericalData(query),
      timestamp: new Date().toISOString()
    };
  }

  getDefaultAnalysis(query) {
    // Fallback analysis when LLM fails
    return {
      intent: ['semantic'],
      complexity: 'medium',
      domain: 'general',
      entities: this.extractEntitiesSimple(query),
      relationships: [],
      requiredReasoning: ['direct'],
      expectedAnswerType: 'explanation',
      ambiguityLevel: 'medium',
      contextRequirements: ['general_knowledge'],
      queryLength: query.length,
      wordCount: query.split(/\s+/).length,
      hasQuestionWords: this.hasQuestionWords(query),
      containsTemporalReferences: this.containsTemporalReferences(query),
      containsNumericalData: this.containsNumericalData(query),
      timestamp: new Date().toISOString()
    };
  }

  extractEntitiesSimple(query) {
    // Simple entity extraction using patterns
    const entities = [];
    const words = query.split(/\s+/);
    
    // Common entity patterns (simplified)
    const capitalWords = words.filter(word => 
      word.length > 2 && word[0] === word[0].toUpperCase()
    );
    
    entities.push(...capitalWords);
    
    // Technical terms
    const techTerms = ['transformer', 'gpt', 'llm', 'nlp', 'machine learning', 'ai'];
    techTerms.forEach(term => {
      if (query.toLowerCase().includes(term)) {
        entities.push(term);
      }
    });
    
    return [...new Set(entities)]; // Remove duplicates
  }

  hasQuestionWords(query) {
    const questionWords = ['what', 'how', 'why', 'when', 'where', 'which', 'who'];
    return questionWords.some(word => 
      query.toLowerCase().startsWith(word) || 
      query.toLowerCase().includes(` ${word} `)
    );
  }

  containsTemporalReferences(query) {
    const temporalPatterns = [
      /\d{4}/, // Years
      /(january|february|march|april|may|june|july|august|september|october|november|december)/i,
      /(yesterday|today|tomorrow|last week|next month)/i,
      /\b\d{1,2}\/\d{1,2}\/\d{4}\b/
    ];
    
    return temporalPatterns.some(pattern => pattern.test(query));
  }

  containsNumericalData(query) {
    const numericalPatterns = [
      /\b\d+\b/,
      /\b\d+\.\d+\b/,
      /(\$|€|£)\d+/,
      /\d+%/
    ];
    
    return numericalPatterns.some(pattern => pattern.test(query));
  }

  generateCacheKey(query) {
    // Simple cache key generation
    return query.toLowerCase().replace(/\s+/g, '_').substring(0, 100);
  }

  // Utility method for strategy selection
  suggestRetrievalStrategy(analysis) {
    const { intent, complexity, requiredReasoning } = analysis;
    
    if (complexity === 'high' || requiredReasoning.includes('multi_hop')) {
      return 'hybrid';
    }
    
    if (intent.includes('relational') || intent.includes('connection')) {
      return 'graph';
    }
    
    if (intent.includes('factual') || intent.includes('filter')) {
      return 'logical';
    }
    
    if (intent.includes('semantic') || intent.includes('similar')) {
      return 'vector';
    }
    
    return 'hybrid'; // Default to hybrid for best coverage
  }

  // Method to clear cache (useful for testing)
  clearCache() {
    this.analysisCache.clear();
  }

  // Get cache statistics
  getCacheStats() {
    return {
      size: this.analysisCache.size,
      hitRate: this.calculateHitRate(), // Would need to track hits/misses
      oldestEntry: this.getOldestCacheEntry()
    };
  }

  calculateHitRate() {
    // Implementation would require tracking actual hits/misses
    return 0.85; // Placeholder
  }

  getOldestCacheEntry() {
    // Simplified implementation
    return this.analysisCache.keys().next().value || 'none';
  }
}