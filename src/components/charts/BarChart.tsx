import * as React from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';

interface BarChartProps {
  data: { name: string; value: number }[];
  title?: string;
  height?: number;
  color?: string;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  title,
  height = 300,
  color = '#3b82f6',
}) => {
  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
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
      data: data.map((d) => d.name),
      axisLine: {
        lineStyle: {
          color: '#e5e7eb',
        },
      },
      axisLabel: {
        color: '#6b7280',
        fontSize: 12,
        interval: 0,
        rotate: data.length > 6 ? 30 : 0,
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
        name: '使用次数',
        type: 'bar',
        barWidth: '60%',
        data: data.map((d) => ({
          value: d.value,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: color },
              { offset: 1, color: color + '80' },
            ]),
            borderRadius: [4, 4, 0, 0],
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
