import { describe, it } from 'node:test';
import assert from 'node:assert';
import React from 'react';
import { Skeleton } from '../../src/components/ui/skeleton';
import {
  ProductListSkeleton,
  ProductDetailSkeleton,
  OrderStatusSkeleton,
  PurchaseCheckoutSkeleton,
} from '../../src/components/ui/domain-skeletons';
import fs from 'node:fs';
import path from 'node:path';

describe('Skeleton Loader Components & Accessibility', () => {
  it('should render Skeleton component with default text variant and accessibility attributes', () => {
    const el = Skeleton({});
    assert.strictEqual(el.props.role, 'status', 'Must have role="status"');
    assert.strictEqual(el.props['aria-live'], 'polite', 'Must have aria-live="polite"');
    assert.strictEqual(el.props['aria-busy'], 'true', 'Must have aria-busy="true"');
    assert.ok(el.props.className.includes('skeleton skeleton-text'), 'Must have default skeleton-text class');

    // Child span must contain accessible screen reader text
    const childSpan = el.props.children;
    assert.ok(childSpan);
    assert.strictEqual(childSpan.props.children, 'Loading content...');
  });

  it('should render Skeleton component with custom variants and dimensions', () => {
    const rectEl = Skeleton({
      variant: 'rect',
      width: 200,
      height: 100,
      className: 'custom-class',
    });
    assert.ok(rectEl.props.className.includes('skeleton-rect'));
    assert.ok(rectEl.props.className.includes('custom-class'));
    assert.strictEqual(rectEl.props.style?.width, 200);
    assert.strictEqual(rectEl.props.style?.height, 100);

    const circleEl = Skeleton({
      variant: 'circle',
      width: '48px',
      height: '48px',
    });
    assert.ok(circleEl.props.className.includes('skeleton-circle'));
    assert.strictEqual(circleEl.props.style?.width, '48px');
  });

  it('should render ProductListSkeleton matching product catalog structure', () => {
    const listEl = ProductListSkeleton();
    assert.strictEqual(listEl.props['aria-busy'], 'true');
    assert.ok(listEl.props.className.includes('container'));

    // Check children sections
    const childrenStr = JSON.stringify(listEl);
    assert.ok(childrenStr.includes('data-table'), 'Should include data table skeleton matching catalog table');
    assert.ok(childrenStr.includes('monitor-grid'), 'Should include monitor grid skeleton matching catalog grid');
  });

  it('should render ProductDetailSkeleton matching product detail structure', () => {
    const detailEl = ProductDetailSkeleton();
    assert.strictEqual(detailEl.props['aria-busy'], 'true');
    assert.ok(detailEl.props.className.includes('container container-reading'));

    const childrenStr = JSON.stringify(detailEl);
    assert.ok(childrenStr.includes('script-specimen-box'), 'Should include specimen box skeleton');
  });

  it('should render OrderStatusSkeleton matching order confirmation structure', () => {
    const orderEl = OrderStatusSkeleton();
    assert.strictEqual(orderEl.props['aria-busy'], 'true');
    assert.ok(orderEl.props.className.includes('container section'));

    const childrenStr = JSON.stringify(orderEl);
    assert.ok(childrenStr.includes('card card-elevated'));
  });

  it('should render PurchaseCheckoutSkeleton matching checkout form structure', () => {
    const checkoutEl = PurchaseCheckoutSkeleton();
    assert.strictEqual(checkoutEl.props['aria-busy'], 'true');
    assert.ok(checkoutEl.props.className.includes('container section'));
  });

  it('should enforce prefers-reduced-motion in globals.css for skeleton animations', () => {
    const cssPath = path.join(process.cwd(), 'src/app/globals.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');

    assert.ok(
      cssContent.includes('@keyframes skeleton-shimmer'),
      'Must define shimmer keyframes'
    );
    assert.ok(
      cssContent.includes('@media (prefers-reduced-motion: reduce)'),
      'Must include prefers-reduced-motion media query'
    );
    assert.ok(
      cssContent.includes('animation: none'),
      'Must disable animation in reduced motion mode'
    );
  });
});
