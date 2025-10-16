import dotenv from 'dotenv';
dotenv.config();

class ConfigManager {
  static get database() {
    return {
      neo4j: {
        uri: process.env.NEO4J_URI || 'bolt://localhost:7687',
        username: process.env.NEO4J_USERNAME || 'neo4j',
        password: process.env.NEO4J_PASSWORD || 'password',
        database: process.env.NEO4J_DATABASE || 'neo4j'
      },
      neptune: {
        host: process.env.NEPTUNE_HOST,
        port: process.env.NEPTUNE_PORT || 8182,
        region: process.env.AWS_REGION || 'us-east-1'
      },
      mongodb: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/graphrag-service'
      }
    };
  }

  static get ai() {
    return {
      openai: {
        apiKey: process.env.OPENAI_API_KEY,
        model: process.env.OPENAI_MODEL || 'gpt-4',
        embeddingModel: process.env.EMBEDDING_MODEL || 'text-embedding-ada-002'
      },
      anthropic: {
        apiKey: process.env.ANTHROPIC_API_KEY
      }
    };
  }

  static get vectorStores() {
    return {
      pinecone: {
        apiKey: process.env.PINECONE_API_KEY,
        environment: process.env.PINECONE_ENVIRONMENT
      },
      weaviate: {
        url: process.env.WEAVIATE_URL,
        apiKey: process.env.WEAVIATE_API_KEY
      }
    };
  }

  static get redis() {
    return {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD
    };
  }
}

export default ConfigManager;