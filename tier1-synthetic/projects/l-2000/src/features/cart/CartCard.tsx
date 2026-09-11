import { useState, useMemo } from 'react';
import { pick } from 'lodash-es';
import { format } from 'date-fns';
import clsx from 'clsx';
import CartSnackbar1 from './CartSnackbar1';
import DocumentsAccordion from '../documents/DocumentsAccordion';
import styles from './CartCard.module.css';

interface CartCardItem {
  updatedAt: Date;
  tags: string[];
  description: string;
  id: string;
}

interface CartCardProps {
  items?: CartCardItem[];
  onItemClick?: (id: string) => void;
  variant?: 'compact' | 'detailed';
  className?: string;
  maxItems?: number;
}

export default function CartCard({
  items = [],
  onItemClick,
  variant = 'detailed',
  className,
  maxItems = 10,
}: CartCardProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'updatedAt' | 'tags'>('updatedAt');

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
          const picked = pick(item, ['updatedAt', 'tags', 'description']);
          const isExpanded = expandedId === item.id;

          return (
            <li
              key={item.id}
              className={clsx(styles.item, isExpanded && styles.expanded)}
              onClick={() => handleToggle(item.id)}
            >
              <div className={styles.itemHeader}>
                <span className={styles.itemTitle}>{picked.updatedAt}</span>
                <span className={styles.meta}>{picked.tags}</span>
              </div>
              {isExpanded && (
                <div className={styles.details}>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Tags</span>
                    <span className={styles.fieldValue}>{item.tags?.join(", ")}</span>
                  </div>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Description</span>
                    <span className={styles.fieldValue}>{String(item.description)}</span>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <div className={styles.children}>
      <CartSnackbar1 />
      <DocumentsAccordion />
      </div>
    </div>
  );
}
