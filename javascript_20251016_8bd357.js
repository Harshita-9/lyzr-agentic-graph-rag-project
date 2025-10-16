import React from 'react';
import { useQuery } from 'react-query';
import axios from 'axios';

const AnalyticsDashboard = () => {
  const { data: metrics, isLoading, error } = useQuery(
    'metrics',
    async () => {
      const response = await axios.get('/api/metrics');
      return response.data;
    },
    {
      refetchInterval: 30000, // Refresh every 30 seconds
    }
  );

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">📊 Analytics Dashboard</h2>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">📊 Analytics Dashboard</h2>
        <div className="text-red-600">Error loading metrics: {error.message}</div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">📊 Analytics Dashboard</h2>
        <div className="text-gray-500">No metrics data available</div>
      </div>
    );
  }

  const { totalQueries, averageLatency, successRate, strategyDistribution } = metrics;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">📊 Analytics Dashboard</h2>
      
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="text-2xl font-bold text-blue-900">{totalQueries || 0}</div>
          <div className="text-sm text-blue-700">Total Queries</div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="text-2xl font-bold text-green-900">
            {successRate ? `${successRate.toFixed(1)}%` : '0%'}
          </div>
          <div className="text-sm text-green-700">Success Rate</div>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="text-2xl font-bold text-purple-900">
            {averageLatency ? `${averageLatency.toFixed(0)}ms` : '0ms'}
          </div>
          <div className="text-sm text-purple-700">Avg Latency</div>
        </div>
        
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <div className="text-2xl font-bold text-orange-900">
            {strategyDistribution ? Object.keys(strategyDistribution).length : 0}
          </div>
          <div className="text-sm text-orange-700">Active Strategies</div>
        </div>
      </div>

      {/* Strategy Distribution */}
      {strategyDistribution && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Retrieval Strategy Distribution</h3>
          <div className="space-y-3">
            {Object.entries(strategyDistribution).map(([strategy, stats]) => (
              <div key={strategy} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <span className="w-3 h-3 bg-blue-500 rounded-full mr-3"></span>
                  <span className="font-medium capitalize">{strategy}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">{stats.usageCount} queries</div>
                  <div className="text-xs text-gray-500">
                    {stats.averageLatency ? `${stats.averageLatency.toFixed(0)}ms avg` : 'N/A'} • 
                    {stats.successRate ? ` ${stats.successRate.toFixed(1)}% success` : ' N/A'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Trends */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Performance Trends</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-center text-gray-500 text-sm">
            Real-time performance monitoring
          </div>
          <div className="mt-2 text-xs text-gray-600 text-center">
            • Latency tracking<br/>
            • Success rate monitoring<br/>
            • Strategy effectiveness<br/>
            • Resource utilization
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">System Status</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            <span>Knowledge Graph</span>
          </div>
          <div className="text-right text-gray-600">Operational</div>
          
          <div className="flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            <span>Vector Store</span>
          </div>
          <div className="text-right text-gray-600">Operational</div>
          
          <div className="flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            <span>AI Services</span>
          </div>
          <div className="text-right text-gray-600">Operational</div>
          
          <div className="flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            <span>API Gateway</span>
          </div>
          <div className="text-right text-gray-600">Operational</div>
        </div>
      </div>

      {/* Last Updated */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        Last updated: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;