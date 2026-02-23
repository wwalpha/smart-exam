import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-emerald-100 text-emerald-800',
        secondary: 'bg-[#FAAC68]/80',
        destructive: 'bg-[#FAAC68]/80',
        outline: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
        warning_soft: 'bg-orange-100 text-orange-800 border border-orange-200',
        success_soft: 'bg-emerald-100 text-emerald-800',
        danger_soft: 'bg-rose-100 text-rose-800',
        subject_math: 'bg-blue-100 text-blue-800 border border-blue-200',
        subject_science: 'bg-orange-100 text-orange-800 border border-orange-200',
        subject_society: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export type BadgeVariant = NonNullable<BadgeProps['variant']>;

export const getSubjectBadgeVariant = (subject?: string): BadgeVariant => {
  if (subject === '4') return 'subject_math';
  if (subject === '2') return 'subject_science';
  if (subject === '3') return 'subject_society';
  return 'outline';
};

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
