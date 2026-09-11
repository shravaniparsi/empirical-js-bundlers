import { useState, useMemo } from 'react';
import { pick } from 'lodash-es';
import { format } from 'date-fns';
import clsx from 'clsx';
import OrdersHOC from './OrdersHOC';
import OrdersThumbnail1 from './OrdersThumbnail1';
import styles from './OrdersProgress1.module.css';

interface OrdersProgress1Item {
  title: string;
  tags: string[];
  updatedAt: Date;
  id: string;
}

interface OrdersProgress1Props {
  items?: OrdersProgress1Item[];
  onItemClick?: (id: string) => void;
  variant?: 'compact' | 'detailed';
  className?: string;
  maxItems?: number;
}

export default function OrdersProgress1({
  items = [],
  onItemClick,
  variant = 'detailed',
  className,
  maxItems = 10,
}: OrdersProgress1Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'title' | 'tags'>('title');

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
            className={clsx(styles.sortBtn, sortField === 'title' && styles.active)}
            onClick={() => handleSort('title')}
          >
            By title
          </button>
        </div>
      </div>

      <ul className={styles.list}>
        {visibleItems.map(item => {
          const picked = pick(item, ['title', 'tags', 'updatedAt']);
          const isExpanded = expandedId === item.id;

          return (
            <li
              key={item.id}
              className={clsx(styles.item, isExpanded && styles.expanded)}
              onClick={() => handleToggle(item.id)}
            >
              <div className={styles.itemHeader}>
                <span className={styles.itemTitle}>{picked.title}</span>
                <span className={styles.meta}>{picked.tags}</span>
              </div>
              {isExpanded && (
                <div className={styles.details}>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Tags</span>
                    <span className={styles.fieldValue}>{item.tags?.join(", ")}</span>
                  </div>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>UpdatedAt</span>
                    <span className={styles.fieldValue}>{format(item.updatedAt, 'PPpp')}</span>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <div className={styles.children}>
      <OrdersHOC />
      <OrdersThumbnail1 />
      </div>
    </div>
  );
}
