import * as React from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';

interface LineChartProps {
  data: { date: string; count: number }[];
  title?: string;
  height?: number;
}

export const LineChart: React.FC<LineChartProps> = ({ data, title, height = 300 }) => {
  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: {
        color: '#374151',
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: title ? 40 : 10,
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: data.map((d) => d.date),
      axisLine: {
        lineStyle: {
          color: '#e5e7eb',
        },
      },
      axisLabel: {
        color: '#6b7280',
        fontSize: 12,
      },
    },
    yAxis: {
      type: 'value',
      splitLine: {
        lineStyle: {
          color: '#f3f4f6',
          type: 'dashed',
        },
      },
      axisLine: {
        show: false,
      },
      axisTick: {
        show: false,
      },
      axisLabel: {
        color: '#6b7280',
        fontSize: 12,
      },
    },
    series: [
      {
        name: '借用次数',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        data: data.map((d) => d.count),
        lineStyle: {
          color: '#3b82f6',
          width: 3,
        },
        itemStyle: {
          color: '#3b82f6',
          borderColor: '#fff',
          borderWidth: 2,
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
            { offset: 1, color: 'rgba(59, 130, 246, 0.05)' },
          ]),
        },
      },
    ],
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-card">
      {title && (
        <h3 className="text-lg font-semibold text-dark-800 mb-4 font-display">{title}</h3>
      )}
      <ReactECharts option={option} style={{ height }} />
    </div>
  );
};
