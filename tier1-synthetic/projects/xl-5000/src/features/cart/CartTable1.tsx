import { useState, useMemo } from 'react';
import { pick } from 'lodash-es';
import { format } from 'date-fns';
import clsx from 'clsx';
import CartHeader from './CartHeader';
import CartHeatmap1 from './CartHeatmap1';
import CartRadio1 from './CartRadio1';
import RolesProgress1 from '../roles/RolesProgress1';
import FeedbackMgmtSummary from '../feedback-mgmt/FeedbackMgmtSummary';
import styles from './CartTable1.module.css';

interface CartTable1Item {
  createdAt: Date;
  title: string;
  priority: number;
  tags: string[];
  id: string;
}

interface CartTable1Props {
  items?: CartTable1Item[];
  onItemClick?: (id: string) => void;
  variant?: 'compact' | 'detailed';
  className?: string;
  maxItems?: number;
}

export default function CartTable1({
  items = [],
  onItemClick,
  variant = 'detailed',
  className,
  maxItems = 10,
}: CartTable1Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'createdAt' | 'title'>('createdAt');

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
            className={clsx(styles.sortBtn, sortField === 'createdAt' && styles.active)}
            onClick={() => handleSort('createdAt')}
          >
            By createdAt
          </button>
        </div>
      </div>

      <ul className={styles.list}>
        {visibleItems.map(item => {
          const picked = pick(item, ['createdAt', 'title', 'priority']);
          const isExpanded = expandedId === item.id;

          return (
            <li
              key={item.id}
              className={clsx(styles.item, isExpanded && styles.expanded)}
              onClick={() => handleToggle(item.id)}
            >
              <div className={styles.itemHeader}>
                <span className={styles.itemTitle}>{picked.createdAt}</span>
                <time className={styles.timestamp}>{format(item.createdAt, 'MMM dd, yyyy')}</time>
              </div>
              {isExpanded && (
                <div className={styles.details}>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Title</span>
                    <span className={styles.fieldValue}>{String(item.title)}</span>
                  </div>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Priority</span>
                    <span className={styles.fieldValue}>{String(item.priority)}</span>
                  </div>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Tags</span>
                    <span className={styles.fieldValue}>{item.tags?.join(", ")}</span>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <div className={styles.children}>
      <CartHeader />
      <CartHeatmap1 />
      <CartRadio1 />
      <RolesProgress1 />
      <FeedbackMgmtSummary />
      </div>
    </div>
  );
}
