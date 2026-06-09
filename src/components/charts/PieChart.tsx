import * as React from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';

interface PieChartProps {
  data: { name: string; value: number }[];
  title?: string;
  height?: number;
}

const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export const PieChart: React.FC<PieChartProps> = ({ data, title, height = 300 }) => {
  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: {
        color: '#374151',
      },
      formatter: '{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
      itemGap: 12,
      textStyle: {
        color: '#6b7280',
        fontSize: 12,
      },
    },
    series: [
      {
        name: '资产类型',
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 4,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: false,
          position: 'center',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold',
            color: '#1f2937',
            formatter: '{b}\n{c}',
          },
        },
        labelLine: {
          show: false,
        },
        data: data.map((d, i) => ({
          ...d,
          itemStyle: {
            color: colors[i % colors.length],
          },
        })),
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
