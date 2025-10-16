import React, { useState } from 'react';
import { useMutation } from 'react-query';
import axios from 'axios';

const QueryInterface = () => {
  const [query, setQuery] = useState('');
  const [streamingData, setStreamingData] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const queryMutation = useMutation({
    mutationFn: async ({ query, stream }) => {
      const response = await axios.post('/api/graphrag/query', {
        query,
        stream,
        context: { domain: 'general' }
      });
      return response.data;
    },
    onSuccess: (data) => {
      console.log('Query result:', data);
    }
  });

  const streamMutation = useMutation({
    mutationFn: async (query) => {
      setIsStreaming(true);
      setStreamingData([]);
      
      const response = await fetch('/api/graphrag/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          stream: true,
          context: { domain: 'general' }
        })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            setStreamingData(prev => [...prev, data]);
          } catch (e) {
            console.error('Error parsing stream chunk:', e);
          }
        }
      }
      
      setIsStreaming(false);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    if (isStreaming) {
      // Already streaming, do nothing
      return;
    }

    // Use streaming for complex queries
    const isComplexQuery = query.split(' ').length > 5;
    
    if (isComplexQuery) {
      streamMutation.mutate(query);
    } else {
      queryMutation.mutate({ query, stream: false });
    }
  };

  const renderStreamingContent = () => {
    if (!isStreaming && streamingData.length === 0) return null;

    return (
      <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold mb-3">Streaming Response</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {streamingData.map((chunk, index) => (
            <div key={index} className={`p-3 rounded ${
              chunk.type === 'error' ? 'bg-red-50 border border-red-200' :
              chunk.type === 'result' ? 'bg-green-50 border border-green-200' :
              'bg-blue-50 border border-blue-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium capitalize">{chunk.type}</span>
                <span className="text-xs text-gray-500">
                  {new Date(chunk.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p className="mt-1 text-sm">{chunk.content}</p>
            </div>
          ))}
          {isStreaming && (
            <div className="flex items-center justify-center p-4">
              <div className="animate-pulse flex space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              </div>
              <span className="ml-2 text-sm text-gray-600">Processing...</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderQueryResult = () => {
    if (queryMutation.isLoading) {
      return (
        <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      );
    }

    if (queryMutation.data) {
      const { data: result } = queryMutation.data;
      
      return (
        <div className="mt-6 space-y-4">
          {/* Query Analysis */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900">Query Analysis</h4>
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <div><strong>Strategy:</strong> {result.strategy}</div>
              <div><strong>Intent:</strong> {result.queryAnalysis.intent?.join(', ')}</div>
              <div><strong>Complexity:</strong> {result.queryAnalysis.complexity}</div>
              <div><strong>Confidence:</strong> {(result.results.retrievalMetadata.confidence * 100).toFixed(1)}%</div>
            </div>
          </div>

          {/* Answer */}
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <h4 className="font-semibold mb-2">Answer</h4>
            <p className="text-gray-700">{result.results.answer}</p>
          </div>

          {/* Supporting Documents */}
          {result.results.supportingDocuments && result.results.supportingDocuments.length > 0 && (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="font-semibold mb-2">
                Supporting Documents ({result.results.supportingDocuments.length})
              </h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {result.results.supportingDocuments.slice(0, 5).map((doc, index) => (
                  <div key={doc.id} className="p-3 bg-white rounded border text-sm">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium">Document {index + 1}</span>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        Score: {(doc.score * 100).toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-gray-600 line-clamp-2">{doc.content}</p>
                    <div className="mt-1 text-xs text-gray-500">
                      Source: {doc.metadata?.source || 'Unknown'} | 
                      Type: {doc.metadata?.type}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">🧠 Knowledge Query Interface</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="query" className="block text-sm font-medium text-gray-700 mb-2">
            Enter your question
          </label>
          <textarea
            id="query"
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Ask anything about your knowledge base... (e.g., 'Explain transformer architectures and their relationship to attention mechanisms')"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isStreaming}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {isStreaming ? 'Streaming response...' : 
             queryMutation.isLoading ? 'Processing...' : 
             'Complex queries will use streaming responses'}
          </div>
          
          <button
            type="submit"
            disabled={!query.trim() || isStreaming || queryMutation.isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isStreaming ? 'Streaming...' : 'Ask Question'}
          </button>
        </div>
      </form>

      {/* Results */}
      {renderStreamingContent()}
      {renderQueryResult()}

      {/* Error Handling */}
      {(queryMutation.isError || streamMutation.isError) && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-red-400">⚠️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error processing query
              </h3>
              <div className="mt-1 text-sm text-red-700">
                {queryMutation.error?.message || streamMutation.error?.message}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QueryInterface;