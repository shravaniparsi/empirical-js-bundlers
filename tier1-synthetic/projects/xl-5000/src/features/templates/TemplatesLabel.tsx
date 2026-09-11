import { useState, useMemo } from 'react';
import { pick } from 'lodash-es';
import { format } from 'date-fns';
import clsx from 'clsx';
import TemplatesRadio from './TemplatesRadio';
import TemplatesGrid4 from './TemplatesGrid4';
import InventoryProgress from '../inventory/InventoryProgress';
import styles from './TemplatesLabel.module.css';

interface TemplatesLabelItem {
  tags: string[];
  title: string;
  status: string;
  id: string;
}

interface TemplatesLabelProps {
  items?: TemplatesLabelItem[];
  onItemClick?: (id: string) => void;
  variant?: 'compact' | 'detailed';
  className?: string;
  maxItems?: number;
}

export default function TemplatesLabel({
  items = [],
  onItemClick,
  variant = 'detailed',
  className,
  maxItems = 10,
}: TemplatesLabelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'tags' | 'title'>('tags');

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
          const picked = pick(item, ['tags', 'title', 'status']);
          const isExpanded = expandedId === item.id;

          return (
            <li
              key={item.id}
              className={clsx(styles.item, isExpanded && styles.expanded)}
              onClick={() => handleToggle(item.id)}
            >
              <div className={styles.itemHeader}>
                <span className={styles.itemTitle}>{picked.tags}</span>
                <span className={styles.meta}>{picked.title}</span>
              </div>
              {isExpanded && (
                <div className={styles.details}>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Title</span>
                    <span className={styles.fieldValue}>{String(item.title)}</span>
                  </div>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Status</span>
                    <span className={styles.fieldValue}>{String(item.status)}</span>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <div className={styles.children}>
      <TemplatesRadio />
      <TemplatesGrid4 />
      <InventoryProgress />
      </div>
    </div>
  );
}
