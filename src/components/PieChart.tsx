'use client';

import { useState, useEffect } from 'react';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';

interface PieChartProps {
  data: {
    label: string;
    value: number;
    color: string;
  }[];
}

export default function PieChart({ data }: PieChartProps) {
  const [mounted, setMounted] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const chartData = data.map(item => ({
    name: item.label,
    value: item.value,
    color: item.color
  }));

  const hasFullCircle = chartData.length === 1 || chartData.some(item => item.value >= 99.9);

  const renderLegend = (props: any) => {
    const { payload } = props;
    if (!payload || payload.length === 0) return null;
    
    return (
      <div className="flex flex-col gap-3">
        {payload.map((entry: any, index: number) => {
          const dataItem = chartData.find(d => d.name === entry.value);
          if (!dataItem) return null;
          
          const isActive = activeIndex === index;
          
          return (
            <div
              key={`legend-${index}`}
              className={`flex items-center justify-between px-4 py-3 rounded min-w-[200px] cursor-pointer transition-all duration-200 ${
                isActive 
                  ? 'bg-gray-200 dark:bg-gray-600 scale-105 shadow-lg' 
                  : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-650'
              }`}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-4 h-4 rounded-full shrink-0 transition-transform duration-200 ${
                    isActive ? 'scale-125' : ''
                  }`}
                  style={{ backgroundColor: entry.color }}
                />
                <span className={`text-sm font-medium text-gray-900 dark:text-white truncate ${
                  isActive ? 'font-bold' : ''
                }`}>
                  {entry.value}
                </span>
              </div>
              <span className={`text-sm font-bold text-gray-700 dark:text-gray-300 ml-3 ${
                isActive ? 'text-gray-900 dark:text-white' : ''
              }`}>
                {dataItem.value.toFixed(1)}%
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
        Win Probability Distribution
      </h3>
      {!mounted ? (
        <div className="flex items-center justify-center h-[400px]">
          <div className="text-gray-400">Loading chart...</div>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-6">
          <ResponsiveContainer width="65%" height={360}>
            <RechartsPie>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={120}
                paddingAngle={hasFullCircle ? 0 : 2}
                dataKey="value"
                animationBegin={0}
                animationDuration={800}
                animationEasing="ease-out"
                stroke="none"
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                {chartData.map((entry, index) => {
                  const isActive = activeIndex === index;
                  return (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color} 
                      stroke="none"
                      opacity={activeIndex === null ? 1 : isActive ? 1 : 0.4}
                      style={{
                        filter: isActive ? 'brightness(1.1)' : 'none',
                        transition: 'opacity 0.2s ease, filter 0.2s ease'
                      }}
                    />
                  );
                })}
              </Pie>
            </RechartsPie>
          </ResponsiveContainer>
          <div className="shrink-0">
            {renderLegend({ payload: chartData.map(d => ({ value: d.name, color: d.color })) })}
          </div>
        </div>
      )}
    </div>
  );
}
