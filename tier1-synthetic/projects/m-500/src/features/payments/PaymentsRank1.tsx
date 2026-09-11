import { useState, useMemo } from 'react';
import { pick } from 'lodash-es';
import { format } from 'date-fns';
import clsx from 'clsx';
import PaymentsStepper from './PaymentsStepper';
import PaymentsRating from './PaymentsRating';
import PaymentsAreaChart from './PaymentsAreaChart';
import SearchDrawer from '../search/SearchDrawer';
import ReviewsScatter from '../reviews/ReviewsScatter';
import InventoryBarChart from '../inventory/InventoryBarChart';
import styles from './PaymentsRank1.module.css';

interface PaymentsRank1Item {
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  description: string;
  title: string;
  status: string;
  id: string;
}

interface PaymentsRank1Props {
  items?: PaymentsRank1Item[];
  onItemClick?: (id: string) => void;
  variant?: 'compact' | 'detailed';
  className?: string;
  maxItems?: number;
}

export default function PaymentsRank1({
  items = [],
  onItemClick,
  variant = 'detailed',
  className,
  maxItems = 10,
}: PaymentsRank1Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'createdAt' | 'updatedAt'>('createdAt');

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
          const picked = pick(item, ['createdAt', 'updatedAt', 'tags']);
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
      <PaymentsStepper />
      <PaymentsRating />
      <PaymentsAreaChart />
      <SearchDrawer />
      <ReviewsScatter />
      <InventoryBarChart />
      </div>
    </div>
  );
}
