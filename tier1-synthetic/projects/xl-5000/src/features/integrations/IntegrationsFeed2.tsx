import { useState, useMemo } from 'react';
import { pick } from 'lodash-es';
import { format } from 'date-fns';
import clsx from 'clsx';
import IntegrationsToggle from './IntegrationsToggle';
import IntegrationsSpinner from './IntegrationsSpinner';
import IntegrationsFunnel from './IntegrationsFunnel';
import styles from './IntegrationsFeed2.module.css';

interface IntegrationsFeed2Item {
  priority: number;
  tags: string[];
  description: string;
  updatedAt: Date;
  createdAt: Date;
  id: string;
}

interface IntegrationsFeed2Props {
  items?: IntegrationsFeed2Item[];
  onItemClick?: (id: string) => void;
  variant?: 'compact' | 'detailed';
  className?: string;
  maxItems?: number;
}

export default function IntegrationsFeed2({
  items = [],
  onItemClick,
  variant = 'detailed',
  className,
  maxItems = 10,
}: IntegrationsFeed2Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'priority' | 'tags'>('priority');

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
            className={clsx(styles.sortBtn, sortField === 'priority' && styles.active)}
            onClick={() => handleSort('priority')}
          >
            By priority
          </button>
        </div>
      </div>

      <ul className={styles.list}>
        {visibleItems.map(item => {
          const picked = pick(item, ['priority', 'tags', 'description']);
          const isExpanded = expandedId === item.id;

          return (
            <li
              key={item.id}
              className={clsx(styles.item, isExpanded && styles.expanded)}
              onClick={() => handleToggle(item.id)}
            >
              <div className={styles.itemHeader}>
                <span className={styles.itemTitle}>{picked.priority}</span>
                <time className={styles.timestamp}>{format(item.createdAt, 'MMM dd, yyyy')}</time>
              </div>

            </li>
          );
        })}
      </ul>

      <div className={styles.children}>
      <IntegrationsToggle />
      <IntegrationsSpinner />
      <IntegrationsFunnel />
      </div>
    </div>
  );
}
