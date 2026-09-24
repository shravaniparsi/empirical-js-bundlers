import { useState, useMemo } from 'react';
import { pick } from 'lodash-es';
import { format } from 'date-fns';
import clsx from 'clsx';
import AnalyticsTable from './AnalyticsTable';
import AnalyticsGauge1 from './AnalyticsGauge1';
import AnalyticsBadge from './AnalyticsBadge';
import DashboardSticky1 from '../dashboard/DashboardSticky1';
import ApiKeysRating from '../api-keys/ApiKeysRating';
import ShippingTag1 from '../shipping/ShippingTag1';
import styles from './AnalyticsRank1.module.css';

interface AnalyticsRank1Item {
  tags: string[];
  description: string;
  createdAt: Date;
  priority: number;
  id: string;
}

interface AnalyticsRank1Props {
  items?: AnalyticsRank1Item[];
  onItemClick?: (id: string) => void;
  variant?: 'compact' | 'detailed';
  className?: string;
  maxItems?: number;
}

export default function AnalyticsRank1({
  items = [],
  onItemClick,
  variant = 'detailed',
  className,
  maxItems = 10,
}: AnalyticsRank1Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'tags' | 'description'>('tags');

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
            className={clsx(styles.sortBtn, sortField === 'tags' && styles.active)}
            onClick={() => handleSort('tags')}
          >
            By tags
          </button>
        </div>
      </div>

      <ul className={styles.list}>
        {visibleItems.map(item => {
          const picked = pick(item, ['tags', 'description', 'createdAt']);
          const isExpanded = expandedId === item.id;

          return (
            <li
              key={item.id}
              className={clsx(styles.item, isExpanded && styles.expanded)}
              onClick={() => handleToggle(item.id)}
            >
              <div className={styles.itemHeader}>
                <span className={styles.itemTitle}>{picked.tags}</span>
                <time className={styles.timestamp}>{format(item.createdAt, 'MMM dd, yyyy')}</time>
              </div>

            </li>
          );
        })}
      </ul>

      <div className={styles.children}>
      <AnalyticsTable />
      <AnalyticsGauge1 />
      <AnalyticsBadge />
      <DashboardSticky1 />
      <ApiKeysRating />
      <ShippingTag1 />
      </div>
    </div>
  );
}
