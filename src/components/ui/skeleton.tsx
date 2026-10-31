import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'title' | 'rect' | 'circle';
  width?: string | number;
  height?: string | number;
  className?: string;
  ariaLabel?: string;
}

export function Skeleton({
  variant = 'text',
  width,
  height,
  className = '',
  style,
  ariaLabel = 'Loading content...',
  ...props
}: SkeletonProps) {
  const variantClass = `skeleton-${variant}`;
  const customStyle: React.CSSProperties = {
    ...style,
    ...(width !== undefined ? { width } : {}),
    ...(height !== undefined ? { height } : {}),
  };

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={`skeleton ${variantClass} ${className}`.trim()}
      style={customStyle}
      {...props}
    >
      <span
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: 0,
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          borderWidth: 0,
        }}
      >
        {ariaLabel}
      </span>
    </div>
  );
}
