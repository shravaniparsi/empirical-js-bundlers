import { useState, useMemo } from 'react';
import { pick } from 'lodash-es';
import { format } from 'date-fns';
import clsx from 'clsx';
import IntegrationsLoader from './IntegrationsLoader';
import IntegrationsBarChart2 from './IntegrationsBarChart2';
import PaymentsCheckbox from '../payments/PaymentsCheckbox';
import KnowledgeBaseErrorBoundary from '../knowledge-base/KnowledgeBaseErrorBoundary';
import styles from './IntegrationsPreview1.module.css';

interface IntegrationsPreview1Item {
  title: string;
  priority: number;
  assignee: string;
  status: string;
  id: string;
}

interface IntegrationsPreview1Props {
  items?: IntegrationsPreview1Item[];
  onItemClick?: (id: string) => void;
  variant?: 'compact' | 'detailed';
  className?: string;
  maxItems?: number;
}

export default function IntegrationsPreview1({
  items = [],
  onItemClick,
  variant = 'detailed',
  className,
  maxItems = 10,
}: IntegrationsPreview1Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'title' | 'priority'>('title');

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
          const picked = pick(item, ['title', 'priority', 'assignee']);
          const isExpanded = expandedId === item.id;

          return (
            <li
              key={item.id}
              className={clsx(styles.item, isExpanded && styles.expanded)}
              onClick={() => handleToggle(item.id)}
            >
              <div className={styles.itemHeader}>
                <span className={styles.itemTitle}>{picked.title}</span>
                <span className={styles.meta}>{picked.priority}</span>
              </div>
              {isExpanded && (
                <div className={styles.details}>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Priority</span>
                    <span className={styles.fieldValue}>{String(item.priority)}</span>
                  </div>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Assignee</span>
                    <span className={styles.fieldValue}>{String(item.assignee)}</span>
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
      <IntegrationsLoader />
      <IntegrationsBarChart2 />
      <PaymentsCheckbox />
      <KnowledgeBaseErrorBoundary />
      </div>
    </div>
  );
}
