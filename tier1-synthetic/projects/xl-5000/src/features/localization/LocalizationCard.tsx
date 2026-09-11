import { useState, useMemo } from 'react';
import { pick } from 'lodash-es';
import { format } from 'date-fns';
import clsx from 'clsx';
import AnalyticsList from '../analytics/AnalyticsList';
import styles from './LocalizationCard.module.css';

interface LocalizationCardItem {
  status: string;
  priority: number;
  assignee: string;
  createdAt: Date;
  id: string;
}

interface LocalizationCardProps {
  items?: LocalizationCardItem[];
  onItemClick?: (id: string) => void;
  variant?: 'compact' | 'detailed';
  className?: string;
  maxItems?: number;
}

export default function LocalizationCard({
  items = [],
  onItemClick,
  variant = 'detailed',
  className,
  maxItems = 10,
}: LocalizationCardProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'status' | 'priority'>('status');

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
            className={clsx(styles.sortBtn, sortField === 'status' && styles.active)}
            onClick={() => handleSort('status')}
          >
            By status
          </button>
        </div>
      </div>

      <ul className={styles.list}>
        {visibleItems.map(item => {
          const picked = pick(item, ['status', 'priority', 'assignee']);
          const isExpanded = expandedId === item.id;

          return (
            <li
              key={item.id}
              className={clsx(styles.item, isExpanded && styles.expanded)}
              onClick={() => handleToggle(item.id)}
            >
              <div className={styles.itemHeader}>
                <span className={styles.itemTitle}>{picked.status}</span>
                <time className={styles.timestamp}>{format(item.createdAt, 'MMM dd, yyyy')}</time>
              </div>
              {isExpanded && (
                <div className={styles.details}>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Priority</span>
                    <span className={styles.fieldValue}>{String(item.priority)}</span>
                  </div>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Assignee</span>
                    <span className={styles.fieldValue}>{String(item.assignee)}</span>
                  </div>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>CreatedAt</span>
                    <span className={styles.fieldValue}>{format(item.createdAt, 'PPpp')}</span>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <div className={styles.children}>
      <AnalyticsList />
      </div>
    </div>
  );
}
