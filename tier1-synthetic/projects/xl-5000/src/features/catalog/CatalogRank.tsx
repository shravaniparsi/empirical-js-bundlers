import { useState, useMemo } from 'react';
import { pick } from 'lodash-es';
import { format } from 'date-fns';
import clsx from 'clsx';
import CatalogTooltip from './CatalogTooltip';
import CatalogMeter from './CatalogMeter';
import CatalogPreview from './CatalogPreview';
import FeedbackMgmtDrawer1 from '../feedback-mgmt/FeedbackMgmtDrawer1';
import OrdersScore1 from '../orders/OrdersScore1';
import ReviewsSpacer1 from '../reviews/ReviewsSpacer1';
import styles from './CatalogRank.module.css';

interface CatalogRankItem {
  createdAt: Date;
  tags: string[];
  status: string;
  updatedAt: Date;
  assignee: string;
  id: string;
}

interface CatalogRankProps {
  items?: CatalogRankItem[];
  onItemClick?: (id: string) => void;
  variant?: 'compact' | 'detailed';
  className?: string;
  maxItems?: number;
}

export default function CatalogRank({
  items = [],
  onItemClick,
  variant = 'detailed',
  className,
  maxItems = 10,
}: CatalogRankProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'createdAt' | 'tags'>('createdAt');

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
          const picked = pick(item, ['createdAt', 'tags', 'status']);
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

            </li>
          );
        })}
      </ul>

      <div className={styles.children}>
      <CatalogTooltip />
      <CatalogMeter />
      <CatalogPreview />
      <FeedbackMgmtDrawer1 />
      <OrdersScore1 />
      <ReviewsSpacer1 />
      </div>
    </div>
  );
}
