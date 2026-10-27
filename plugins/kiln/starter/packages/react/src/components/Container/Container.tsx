import { forwardRef, type HTMLAttributes } from 'react';
import { cx } from '../../cx';
import styles from './Container.module.css';

export type ContainerSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  /** Maximum width. sm is 640px, md 768, lg 1024, xl 1200 (the default) and 2xl 1440. */
  size?: ContainerSize;
}

/** Centres content at a maximum width with the responsive page margin (16 → 32 → 48px). */
export const Container = forwardRef<HTMLDivElement, ContainerProps>(function Container({ size = 'xl', className, ...rest }, ref) {
  return <div ref={ref} data-component="Container" className={cx(styles.root, styles[`s-${size}`], className)} {...rest} />;
});
