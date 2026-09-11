import { useState, useCallback, useMemo } from 'react';
import clsx from 'clsx';
import InventoryFooter1 from './InventoryFooter1';
import InventoryChip from './InventoryChip';
import InventorySidebar from './InventorySidebar';
import UsersScatter2 from '../users/UsersScatter2';
import ReviewsStat from '../reviews/ReviewsStat';
import AnalyticsList from '../analytics/AnalyticsList';
import WorkflowsFactory from '../workflows/WorkflowsFactory';
import styles from './InventoryHeader1.module.css';

type LayoutDirection = 'horizontal' | 'vertical';
type LayoutGap = 'none' | 'sm' | 'md' | 'lg' | 'xl';

interface InventoryHeader1Props {
  children?: React.ReactNode;
  direction?: LayoutDirection;
  gap?: LayoutGap;
  padding?: LayoutGap;
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
  wrap?: boolean;
  fullWidth?: boolean;
  className?: string;
  as?: 'div' | 'section' | 'main' | 'aside' | 'article';

}

export default function InventoryHeader1({
  children,
  direction = 'vertical',
  gap = 'md',
  padding = 'md',
  align = 'stretch',
  justify = 'start',
  wrap = false,
  fullWidth = false,
  className,
  as: Component = 'div',

}: InventoryHeader1Props) {
  const [isVisible, setIsVisible] = useState(true);

  const toggleVisibility = useCallback(() => {
    setIsVisible(prev => !prev);
  }, []);

  const containerClasses = useMemo(
    () =>
      clsx(
        styles.container,
        styles[`dir-${direction}`],
        styles[`gap-${gap}`],
        styles[`pad-${padding}`],
        styles[`align-${align}`],
        styles[`justify-${justify}`],
        wrap && styles.wrap,
        fullWidth && styles.fullWidth,
        className
      ),
    [direction, gap, padding, align, justify, wrap, fullWidth, className]
  );

  return (
    <Component className={containerClasses}>
      {isVisible && (
        <div className={styles.content}>
          {children}
      <InventoryFooter1 />
      <InventoryChip />
      <InventorySidebar />
      <UsersScatter2 />
      <ReviewsStat />
      <AnalyticsList />
      <WorkflowsFactory />
        </div>
      )}
    </Component>
  );
}
