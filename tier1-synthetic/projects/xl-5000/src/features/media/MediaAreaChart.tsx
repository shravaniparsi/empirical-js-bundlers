import { useState, useMemo, useCallback } from 'react';
import clsx from 'clsx';
import {
  ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import SupportTextArea1 from '../support/SupportTextArea1';
import styles from './MediaAreaChart.module.css';

interface DataPoint {
  name: string;
  value: number;
  secondary?: number;
  category?: string;
}

interface MediaAreaChartProps {
  data: DataPoint[];
  title?: string;
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  colorScheme?: 'blue' | 'green' | 'purple' | 'orange';
  className?: string;
  onDataClick?: (point: DataPoint) => void;
}

const COLOR_SCHEMES = {
  blue: ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe'],
  green: ['#22c55e', '#4ade80', '#86efac', '#bbf7d0', '#dcfce7'],
  purple: ['#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe'],
  orange: ['#f97316', '#fb923c', '#fdba74', '#fed7aa', '#ffedd5'],
};

export default function MediaAreaChart({
  data,
  title,
  height = 300,
  showLegend = true,
  showGrid = true,
  colorScheme = 'blue',
  className,
  onDataClick,
}: MediaAreaChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const colors = useMemo(() => COLOR_SCHEMES[colorScheme], [colorScheme]);

  const processedData = useMemo(() => {
    if (!data?.length) return [];
    return data.map((d, i) => ({
      ...d,
      fill: colors[i % colors.length],
    }));
  }, [data, colors]);

  const stats = useMemo(() => {
    if (!data?.length) return { total: 0, avg: 0, max: 0, min: 0 };
    const values = data.map(d => d.value);
    return {
      total: values.reduce((s, v) => s + v, 0),
      avg: values.reduce((s, v) => s + v, 0) / values.length,
      max: Math.max(...values),
      min: Math.min(...values),
    };
  }, [data]);

  const handleClick = useCallback(
    (point: DataPoint, index: number) => {
      setActiveIndex(prev => (prev === index ? null : index));
      onDataClick?.(point);
    },
    [onDataClick]
  );

  if (!processedData.length) {
    return (
      <div className={clsx(styles.container, styles.empty, className)}>
        <p className={styles.emptyText}>No data available</p>
      </div>
    );
  }

  return (
    <div className={clsx(styles.container, className)}>
      {title && <h3 className={styles.title}>{title}</h3>}

      <div className={styles.statsRow}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Total</span>
          <span className={styles.statValue}>{stats.total.toLocaleString()}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Average</span>
          <span className={styles.statValue}>{stats.avg.toFixed(1)}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Range</span>
          <span className={styles.statValue}>{stats.min}–{stats.max}</span>
        </div>
      </div>

      <div className={styles.chartWrapper} style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={processedData}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />}
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            {showLegend && <Legend />}
            <Line type="monotone" dataKey="value" stroke={colors[0]} strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className={styles.extra}>
      <SupportTextArea1 />
      </div>
    </div>
  );
}
