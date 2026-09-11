import { useState, useMemo } from 'react';
import { pick } from 'lodash-es';
import { format } from 'date-fns';
import clsx from 'clsx';
import ReportsTag1 from './ReportsTag1';
import ReviewsInput1 from '../reviews/ReviewsInput1';
import InventorySearch from '../inventory/InventorySearch';
import styles from './ReportsPreview.module.css';

interface ReportsPreviewItem {
  title: string;
  assignee: string;
  status: string;
  tags: string[];
  description: string;
  id: string;
}

interface ReportsPreviewProps {
  items?: ReportsPreviewItem[];
  onItemClick?: (id: string) => void;
  variant?: 'compact' | 'detailed';
  className?: string;
  maxItems?: number;
}

export default function ReportsPreview({
  items = [],
  onItemClick,
  variant = 'detailed',
  className,
  maxItems = 10,
}: ReportsPreviewProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'title' | 'assignee'>('title');

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
          const picked = pick(item, ['title', 'assignee', 'status']);
          const isExpanded = expandedId === item.id;

          return (
            <li
              key={item.id}
              className={clsx(styles.item, isExpanded && styles.expanded)}
              onClick={() => handleToggle(item.id)}
            >
              <div className={styles.itemHeader}>
                <span className={styles.itemTitle}>{picked.title}</span>
                <span className={styles.meta}>{picked.assignee}</span>
              </div>

            </li>
          );
        })}
      </ul>

      <div className={styles.children}>
      <ReportsTag1 />
      <ReviewsInput1 />
      <InventorySearch />
      </div>
    </div>
  );
}
