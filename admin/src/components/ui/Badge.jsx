import { cn } from '@/utils';

const variants = {
  success: 'badge-success',
  warning: 'badge-warning',
  danger: 'badge-danger',
  info: 'badge-info',
  gray: 'badge-gray',
};

export default function Badge({ children, variant = 'gray', className }) {
  return <span className={cn(variants[variant], className)}>{children}</span>;
}
