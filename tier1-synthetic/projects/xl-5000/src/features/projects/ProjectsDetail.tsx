import { useState, useMemo } from 'react';
import { pick } from 'lodash-es';
import { format } from 'date-fns';
import clsx from 'clsx';
import ProjectsInfiniteScroll1 from './ProjectsInfiniteScroll1';
import ProjectsAreaChart1 from './ProjectsAreaChart1';
import ProjectsBarChart1 from './ProjectsBarChart1';
import NotificationsAreaChart from '../notifications/NotificationsAreaChart';
import styles from './ProjectsDetail.module.css';

interface ProjectsDetailItem {
  title: string;
  description: string;
  status: string;
  id: string;
}

interface ProjectsDetailProps {
  items?: ProjectsDetailItem[];
  onItemClick?: (id: string) => void;
  variant?: 'compact' | 'detailed';
  className?: string;
  maxItems?: number;
}

export default function ProjectsDetail({
  items = [],
  onItemClick,
  variant = 'detailed',
  className,
  maxItems = 10,
}: ProjectsDetailProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'title' | 'description'>('title');

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
          const picked = pick(item, ['title', 'description', 'status']);
          const isExpanded = expandedId === item.id;

          return (
            <li
              key={item.id}
              className={clsx(styles.item, isExpanded && styles.expanded)}
              onClick={() => handleToggle(item.id)}
            >
              <div className={styles.itemHeader}>
                <span className={styles.itemTitle}>{picked.title}</span>
                <span className={styles.meta}>{picked.description}</span>
              </div>

            </li>
          );
        })}
      </ul>

      <div className={styles.children}>
      <ProjectsInfiniteScroll1 />
      <ProjectsAreaChart1 />
      <ProjectsBarChart1 />
      <NotificationsAreaChart />
      </div>
    </div>
  );
}
