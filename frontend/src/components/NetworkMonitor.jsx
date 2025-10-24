// Real-time Network Monitor Component
// Shows live network conditions with visual indicators

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FaNetworkWired, FaBolt, FaExclamationTriangle,
  FaCheckCircle, FaClock
} from 'react-icons/fa';

const NetworkMonitor = ({ conditions, routingStats }) => {
  const [history, setHistory] = useState([]);
  const [latestUpdate, setLatestUpdate] = useState(Date.now());

  useEffect(() => {
    // Add current condition to history
    setHistory(prev => {
      const newHistory = [
        ...prev,
        {
          timestamp: Date.now(),
          condition: conditions,
          avgConfirmTime: routingStats?.averageConfirmTime || 0
        }
      ].slice(-20); // Keep last 20 readings
      return newHistory;
    });
    setLatestUpdate(Date.now());
  }, [conditions, routingStats]);

  const getConditionInfo = (condition) => {
    const info = {
      low: {
        color: '#10B981',
        bg: 'bg-green-500',
        text: 'text-green-400',
        label: 'Optimal',
        icon: FaCheckCircle,
        description: 'Perfect conditions for transactions'
      },
      normal: {
        color: '#3B82F6',
        bg: 'bg-blue-500',
        text: 'text-blue-400',
        label: 'Normal',
        icon: FaBolt,
        description: 'Standard network conditions'
      },
      high: {
        color: '#F59E0B',
        bg: 'bg-yellow-500',
        text: 'text-yellow-400',
        label: 'Busy',
        icon: FaClock,
        description: 'Higher than usual traffic'
      },
      critical: {
        color: '#EF4444',
        bg: 'bg-red-500',
        text: 'text-red-400',
        label: 'Congested',
        icon: FaExclamationTriangle,
        description: 'High network congestion'
      }
    };
    return info[condition] || info.normal;
  };

  const currentInfo = getConditionInfo(conditions);
  const Icon = currentInfo.icon;

  return (
    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-lg ${currentInfo.bg} bg-opacity-20`}>
            <FaNetworkWired className={`text-2xl ${currentInfo.text}`} />
          </div>
          <div>
            <h3 className="font-bold text-lg">Network Monitor</h3>
            <p className="text-sm text-gray-400">Real-time conditions</p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{ backgroundColor: currentInfo.color + '20' }}>
          <div className={`w-2 h-2 rounded-full ${currentInfo.bg} animate-pulse`} />
          <span className={`font-semibold ${currentInfo.text}`}>
            {currentInfo.label}
          </span>
        </div>
      </div>

      {/* Current Status */}
      <div className="bg-gray-700/30 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-3 mb-3">
          <Icon className={`text-3xl ${currentInfo.text}`} />
          <div className="flex-1">
            <div className="text-sm text-gray-400 mb-1">Current Status</div>
            <div className="font-semibold text-white">{currentInfo.description}</div>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-600">
          <div>
            <div className="text-xs text-gray-500 mb-1">Avg Confirm Time</div>
            <div className={`text-lg font-bold ${currentInfo.text}`}>
              {routingStats?.averageConfirmTime || 0}ms
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Success Rate</div>
            <div className="text-lg font-bold text-green-400">
              {routingStats?.successRate || 0}%
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Total Routed</div>
            <div className="text-lg font-bold text-blue-400">
              {routingStats?.totalRouted || 0}
            </div>
          </div>
        </div>
      </div>

      {/* History Graph */}
      <div className="bg-gray-700/20 rounded-lg p-4">
        <div className="text-sm text-gray-400 mb-3">Condition History (last 20 readings)</div>
        <div className="flex items-end gap-1 h-16">
          {history.map((reading, index) => {
            const info = getConditionInfo(reading.condition);
            const heightPercent = {
              low: 25,
              normal: 50,
              high: 75,
              critical: 100
            }[reading.condition] || 50;

            return (
              <motion.div
                key={index}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: `${heightPercent}%`, opacity: 1 }}
                className={`flex-1 ${info.bg} rounded-t transition-all hover:opacity-75 cursor-pointer`}
                title={`${info.label} - ${new Date(reading.timestamp).toLocaleTimeString()}`}
                style={{ minWidth: '4px' }}
              />
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-3 text-xs">
          {['low', 'normal', 'high', 'critical'].map(cond => {
            const info = getConditionInfo(cond);
            return (
              <div key={cond} className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${info.bg}`} />
                <span className="text-gray-400">{info.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Last Update */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        Last updated: {new Date(latestUpdate).toLocaleTimeString()}
      </div>
    </div>
  );
};

export default NetworkMonitor;
