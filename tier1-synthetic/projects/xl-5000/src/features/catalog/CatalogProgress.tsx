import { useState, useMemo } from 'react';
import { pick } from 'lodash-es';
import { format } from 'date-fns';
import clsx from 'clsx';
import CatalogDatePicker from './CatalogDatePicker';
import CatalogRank1 from './CatalogRank1';
import ShippingPieChart from '../shipping/ShippingPieChart';
import IntegrationsScroll1 from '../integrations/IntegrationsScroll1';
import styles from './CatalogProgress.module.css';

interface CatalogProgressItem {
  description: string;
  assignee: string;
  createdAt: Date;
  updatedAt: Date;
  priority: number;
  id: string;
}

interface CatalogProgressProps {
  items?: CatalogProgressItem[];
  onItemClick?: (id: string) => void;
  variant?: 'compact' | 'detailed';
  className?: string;
  maxItems?: number;
}

export default function CatalogProgress({
  items = [],
  onItemClick,
  variant = 'detailed',
  className,
  maxItems = 10,
}: CatalogProgressProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'description' | 'assignee'>('description');

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
            className={clsx(styles.sortBtn, sortField === 'description' && styles.active)}
            onClick={() => handleSort('description')}
          >
            By description
          </button>
        </div>
      </div>

      <ul className={styles.list}>
        {visibleItems.map(item => {
          const picked = pick(item, ['description', 'assignee', 'createdAt']);
          const isExpanded = expandedId === item.id;

          return (
            <li
              key={item.id}
              className={clsx(styles.item, isExpanded && styles.expanded)}
              onClick={() => handleToggle(item.id)}
            >
              <div className={styles.itemHeader}>
                <span className={styles.itemTitle}>{picked.description}</span>
                <time className={styles.timestamp}>{format(item.createdAt, 'MMM dd, yyyy')}</time>
              </div>

            </li>
          );
        })}
      </ul>

      <div className={styles.children}>
      <CatalogDatePicker />
      <CatalogRank1 />
      <ShippingPieChart />
      <IntegrationsScroll1 />
      </div>
    </div>
  );
}
