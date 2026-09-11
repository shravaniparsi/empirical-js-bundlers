import { useState, useMemo } from 'react';
import { pick } from 'lodash-es';
import { format } from 'date-fns';
import clsx from 'clsx';
import AnalyticsRegistry from './AnalyticsRegistry';
import AnalyticsFactory from './AnalyticsFactory';
import AnalyticsSplit1 from './AnalyticsSplit1';
import styles from './AnalyticsTag1.module.css';

interface AnalyticsTag1Item {
  updatedAt: Date;
  title: string;
  status: string;
  priority: number;
  id: string;
}

interface AnalyticsTag1Props {
  items?: AnalyticsTag1Item[];
  onItemClick?: (id: string) => void;
  variant?: 'compact' | 'detailed';
  className?: string;
  maxItems?: number;
}

export default function AnalyticsTag1({
  items = [],
  onItemClick,
  variant = 'detailed',
  className,
  maxItems = 10,
}: AnalyticsTag1Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'updatedAt' | 'title'>('updatedAt');

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
            className={clsx(styles.sortBtn, sortField === 'updatedAt' && styles.active)}
            onClick={() => handleSort('updatedAt')}
          >
            By updatedAt
          </button>
        </div>
      </div>

      <ul className={styles.list}>
        {visibleItems.map(item => {
          const picked = pick(item, ['updatedAt', 'title', 'status']);
          const isExpanded = expandedId === item.id;

          return (
            <li
              key={item.id}
              className={clsx(styles.item, isExpanded && styles.expanded)}
              onClick={() => handleToggle(item.id)}
            >
              <div className={styles.itemHeader}>
                <span className={styles.itemTitle}>{picked.updatedAt}</span>
                <span className={styles.meta}>{picked.title}</span>
              </div>

            </li>
          );
        })}
      </ul>

      <div className={styles.children}>
      <AnalyticsRegistry />
      <AnalyticsFactory />
      <AnalyticsSplit1 />
      </div>
    </div>
  );
}
