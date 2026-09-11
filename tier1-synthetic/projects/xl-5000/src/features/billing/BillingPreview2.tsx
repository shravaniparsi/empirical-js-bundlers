import { useState, useMemo } from 'react';
import { pick } from 'lodash-es';
import { format } from 'date-fns';
import clsx from 'clsx';
import BillingRetry1 from './BillingRetry1';
import BillingTooltip from './BillingTooltip';
import styles from './BillingPreview2.module.css';

interface BillingPreview2Item {
  tags: string[];
  assignee: string;
  updatedAt: Date;
  status: string;
  title: string;
  id: string;
}

interface BillingPreview2Props {
  items?: BillingPreview2Item[];
  onItemClick?: (id: string) => void;
  variant?: 'compact' | 'detailed';
  className?: string;
  maxItems?: number;
}

export default function BillingPreview2({
  items = [],
  onItemClick,
  variant = 'detailed',
  className,
  maxItems = 10,
}: BillingPreview2Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'tags' | 'assignee'>('tags');

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
          const picked = pick(item, ['tags', 'assignee', 'updatedAt']);
          const isExpanded = expandedId === item.id;

          return (
            <li
              key={item.id}
              className={clsx(styles.item, isExpanded && styles.expanded)}
              onClick={() => handleToggle(item.id)}
            >
              <div className={styles.itemHeader}>
                <span className={styles.itemTitle}>{picked.tags}</span>
                <span className={styles.meta}>{picked.assignee}</span>
              </div>

            </li>
          );
        })}
      </ul>

      <div className={styles.children}>
      <BillingRetry1 />
      <BillingTooltip />
      </div>
    </div>
  );
}
