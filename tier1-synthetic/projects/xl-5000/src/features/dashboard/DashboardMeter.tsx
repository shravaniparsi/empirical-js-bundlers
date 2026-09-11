import { useState, useMemo } from 'react';
import { pick } from 'lodash-es';
import { format } from 'date-fns';
import clsx from 'clsx';
import DashboardProgress from './DashboardProgress';
import DashboardColorPicker1 from './DashboardColorPicker1';
import DashboardAreaChart from './DashboardAreaChart';
import IntegrationsScroll1 from '../integrations/IntegrationsScroll1';
import styles from './DashboardMeter.module.css';

interface DashboardMeterItem {
  priority: number;
  updatedAt: Date;
  title: string;
  assignee: string;
  tags: string[];
  description: string;
  id: string;
}

interface DashboardMeterProps {
  items?: DashboardMeterItem[];
  onItemClick?: (id: string) => void;
  variant?: 'compact' | 'detailed';
  className?: string;
  maxItems?: number;
}

export default function DashboardMeter({
  items = [],
  onItemClick,
  variant = 'detailed',
  className,
  maxItems = 10,
}: DashboardMeterProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'priority' | 'updatedAt'>('priority');

  const visibleItems = useMemo(() => {
    const sorted = [...items].sort((a, b) => {
      const aVal = String(a[sortField] ?? '');
      const bVal = String(b[sortField] ?? '');
      return aVal.localeCompare(bVal);
    });
    return sorted.slice(0, maxItems);
  }, [items, sortField, maxItems]);

  const summary = useMemo(
    () => ({ total: items.length, visible: visibleItems.length }),
    [items.length, visibleItems.length]
  );

  const handleToggle = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
    onItemClick?.(id);
  };

  const handleSort = (field: typeof sortField) => {
    setSortField(field);
  };

  return (
    <div className={clsx(styles.container, styles[variant], className)}>
      <div className={styles.header}>
        <span className={styles.count}>
          Showing {summary.visible} of {summary.total}
        </span>
        <div className={styles.sortControls}>
          <button
            className={clsx(styles.sortBtn, sortField === 'priority' && styles.active)}
            onClick={() => handleSort('priority')}
          >
            By priority
          </button>
        </div>
      </div>

      <ul className={styles.list}>
        {visibleItems.map(item => {
          const picked = pick(item, ['priority', 'updatedAt', 'title']);
          const isExpanded = expandedId === item.id;

          return (
            <li
              key={item.id}
              className={clsx(styles.item, isExpanded && styles.expanded)}
              onClick={() => handleToggle(item.id)}
            >
              <div className={styles.itemHeader}>
                <span className={styles.itemTitle}>{picked.priority}</span>
                <span className={styles.meta}>{picked.updatedAt}</span>
              </div>

            </li>
          );
        })}
      </ul>

      <div className={styles.children}>
      <DashboardProgress />
      <DashboardColorPicker1 />
      <DashboardAreaChart />
      <IntegrationsScroll1 />
      </div>
    </div>
  );
}
