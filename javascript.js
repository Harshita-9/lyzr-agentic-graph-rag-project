import { OpenAI } from 'openai';
import ConfigManager from '../core/ConfigManager.js';

export class EntityResolver {
  constructor() {
    this.openai = new OpenAI({ apiKey: ConfigManager.ai.openai.apiKey });
    this.similarityThreshold = 0.85;
    this.entityCache = new Map();
  }

  async resolveEntities(entities) {
    console.log(`🔄 Resolving ${entities.length} entities for deduplication`);
    
    const resolvedEntities = [];
    const clusters = await this.clusterSimilarEntities(entities);
    
    for (const cluster of clusters) {
      const canonicalEntity = await this.mergeEntityCluster(cluster);
      resolvedEntities.push(canonicalEntity);
    }
    
    console.log(`✅ Resolved ${entities.length} entities to ${resolvedEntities.length} canonical entities`);
    return resolvedEntities;
  }

  async clusterSimilarEntities(entities) {
    const clusters = [];
    const processed = new Set();
    
    for (let i = 0; i < entities.length; i++) {
      if (processed.has(i)) continue;
      
      const cluster = [entities[i]];
      processed.add(i);
      
      for (let j = i + 1; j < entities.length; j++) {
        if (processed.has(j)) continue;
        
        const similarity = await this.calculateEntitySimilarity(entities[i], entities[j]);
        if (similarity >= this.similarityThreshold) {
          cluster.push(entities[j]);
          processed.add(j);
        }
      }
      
      clusters.push(cluster);
    }
    
    return clusters;
  }

  async calculateEntitySimilarity(entity1, entity2) {
    // Multi-faceted similarity calculation
    const nameSimilarity = this.calculateStringSimilarity(entity1.name, entity2.name);
    const typeSimilarity = entity1.type === entity2.type ? 1 : 0;
    const embeddingSimilarity = await this.calculateEmbeddingSimilarity(entity1, entity2);
    
    // Weighted combination
    const similarity = (nameSimilarity * 0.4) + (typeSimilarity * 0.3) + (embeddingSimilarity * 0.3);
    return similarity;
  }

  async calculateEmbeddingSimilarity(entity1, entity2) {
    if (!entity1.embedding || !entity2.embedding) {
      return this.calculateStringSimilarity(entity1.name, entity2.name);
    }
    
    // Cosine similarity calculation
    const dotProduct = entity1.embedding.reduce((sum, a, i) => sum + a * entity2.embedding[i], 0);
    const magnitude1 = Math.sqrt(entity1.embedding.reduce((sum, a) => sum + a * a, 0));
    const magnitude2 = Math.sqrt(entity2.embedding.reduce((sum, a) => sum + a * a, 0));
    
    return dotProduct / (magnitude1 * magnitude2);
  }

  calculateStringSimilarity(str1, str2) {
    // Jaro-Winkler similarity
    const jaroDistance = this.jaroWinkler(str1.toLowerCase(), str2.toLowerCase());
    return jaroDistance;
  }

  async mergeEntityCluster(cluster) {
    if (cluster.length === 1) return cluster[0];
    
    // Use LLM to determine canonical representation
    const canonical = await this.determineCanonicalEntity(cluster);
    
    return {
      ...canonical,
      mergedFrom: cluster.map(e => e.id),
      sourceCount: cluster.length,
      confidence: this.calculateMergeConfidence(cluster)
    };
  }

  async determineCanonicalEntity(cluster) {
    const entityList = cluster.map(e => `${e.name} (${e.type})`).join(', ');
    
    const prompt = `Determine the canonical representation for these similar entities:
    Entities: ${entityList}
    
    Return JSON: {"canonicalName": "name", "canonicalType": "type", "reasoning": "explanation"}`;
    
    const completion = await this.openai.chat.completions.create({
      model: ConfigManager.ai.openai.model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1
    });
    
    const result = JSON.parse(completion.choices[0].message.content);
    
    // Find the best matching entity from cluster
    const bestMatch = cluster.reduce((best, current) => 
      current.name === result.canonicalName ? current : best
    , cluster[0]);
    
    return {
      ...bestMatch,
      name: result.canonicalName,
      type: result.canonicalType,
      attributes: this.mergeAttributes(cluster)
    };
  }

  mergeAttributes(cluster) {
    const merged = {};
    
    for (const entity of cluster) {
      if (entity.attributes) {
        for (const [key, value] of Object.entries(entity.attributes)) {
          if (!merged[key] || this.isBetterAttributeValue(value, merged[key])) {
            merged[key] = value;
          }
        }
      }
    }
    
    return merged;
  }

  isBetterAttributeValue(newValue, existingValue) {
    // Prefer longer, more specific values
    if (typeof newValue === 'string' && typeof existingValue === 'string') {
      return newValue.length > existingValue.length;
    }
    return true;
  }

  calculateMergeConfidence(cluster) {
    const avgSimilarity = cluster.reduce((sum, entity, index, array) => {
      if (index === 0) return 0;
      return sum + this.calculateStringSimilarity(array[0].name, entity.name);
    }, 0) / (cluster.length - 1);
    
    return avgSimilarity;
  }

  jaroWinkler(s1, s2) {
    // Jaro-Winkler similarity implementation
    let m = 0;
    let i, j;
    const s1Len = s1.length;
    const s2Len = s2.length;
    
    if (s1Len === 0 || s2Len === 0) return 0;
    
    const matchDistance = Math.floor(Math.max(s1Len, s2Len) / 2) - 1;
    const s1Matches = new Array(s1Len);
    const s2Matches = new Array(s2Len);
    
    for (i = 0; i < s1Len; i++) {
      const low = i >= matchDistance ? i - matchDistance : 0;
      const high = i + matchDistance <= s2Len - 1 ? i + matchDistance : s2Len - 1;
      
      for (j = low; j <= high; j++) {
        if (!s2Matches[j] && s1[i] === s2[j]) {
          s1Matches[i] = true;
          s2Matches[j] = true;
          m++;
          break;
        }
      }
    }
    
    if (m === 0) return 0;
    
    let k = 0;
    let numTrans = 0;
    
    for (i = 0; i < s1Len; i++) {
      if (s1Matches[i]) {
        while (!s2Matches[k]) k++;
        if (s1[i] !== s2[k]) numTrans++;
        k++;
      }
    }
    
    const weight = (m / s1Len + m / s2Len + (m - numTrans / 2) / m) / 3;
    let l = 0;
    const p = 0.1;
    
    while (s1[l] === s2[l] && l < 4) l++;
    
    return weight + l * p * (1 - weight);
  }
}