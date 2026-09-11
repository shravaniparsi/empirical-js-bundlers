import { useState, useCallback, useMemo } from 'react';
import clsx from 'clsx';
import TeamsTextArea from './TeamsTextArea';
import TeamsResponsive3 from './TeamsResponsive3';
import InventoryList1 from '../inventory/InventoryList1';
import UsersDonut2 from '../users/UsersDonut2';
import RolesLoader from '../roles/RolesLoader';
import ActivityGrid3 from '../activity/ActivityGrid3';
import styles from './TeamsContainer.module.css';

type LayoutDirection = 'horizontal' | 'vertical';
type LayoutGap = 'none' | 'sm' | 'md' | 'lg' | 'xl';

interface TeamsContainerProps {
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

export default function TeamsContainer({
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

}: TeamsContainerProps) {
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
      <TeamsTextArea />
      <TeamsResponsive3 />
      <InventoryList1 />
      <UsersDonut2 />
      <RolesLoader />
      <ActivityGrid3 />
        </div>
      )}
    </Component>
  );
}
