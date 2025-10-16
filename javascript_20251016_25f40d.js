import React from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import OntologyVisualEditor from './components/OntologyVisualEditor';
import QueryInterface from './components/QueryInterface';
import AnalyticsDashboard from './components/AnalyticsDashboard';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold text-gray-900">
              🧠 Agentic Graph RAG Service
            </h1>
            <p className="text-gray-600">
              Production-grade knowledge base with intelligent retrieval
            </p>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <QueryInterface />
            </div>
            <div className="lg:col-span-1">
              <AnalyticsDashboard />
            </div>
          </div>
          
          <div className="mt-8">
            <OntologyVisualEditor />
          </div>
        </main>
      </div>
    </QueryClientProvider>
  );
}

export default App;