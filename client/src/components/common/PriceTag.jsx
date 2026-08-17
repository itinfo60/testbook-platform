export default function PriceTag({ price, originalPrice, className = '', size = 'md' }) {
  const sizes = {
    sm: { price: 'text-base', original: 'text-xs' },
    md: { price: 'text-xl', original: 'text-sm' },
    lg: { price: 'text-3xl', original: 'text-base' },
    xl: { price: 'text-4xl', original: 'text-lg' },
  };

  const isFree = !price || price === 0;
  const hasDiscount = originalPrice && originalPrice > price;
  const discountPercent = hasDiscount
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span
        className={`${sizes[size].price} font-bold ${isFree ? 'text-success-600 dark:text-success-400' : 'text-slate-900 dark:text-white'}`}
      >
        {isFree ? 'Free' : `₹${price?.toLocaleString('en-IN')}`}
      </span>
      {hasDiscount && (
        <>
          <span className={`${sizes[size].original} text-dark-400 line-through`}>
            ₹{originalPrice?.toLocaleString('en-IN')}
          </span>
          <span className="badge-success">{discountPercent}% off</span>
        </>
      )}
    </div>
  );
}
