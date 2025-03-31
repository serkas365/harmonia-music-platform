import { useState, useEffect } from 'react';
import { ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/stores/useCartStore';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface CartIndicatorProps {
  className?: string;
}

export const CartIndicator = ({ className }: CartIndicatorProps) => {
  const { t } = useTranslation();
  const { items } = useCartStore();
  const [highlighted, setHighlighted] = useState(false);
  const itemCount = items.length;

  // Show highlight animation when cart changes
  useEffect(() => {
    if (itemCount > 0) {
      setHighlighted(true);
      const timeout = setTimeout(() => setHighlighted(false), 1000);
      return () => clearTimeout(timeout);
    }
  }, [itemCount]);

  return (
    <div 
      className={cn(
        "relative flex items-center", 
        className
      )}
      aria-label={t('cart.cartItems', { count: itemCount })}
    >
      <ShoppingCart className="h-5 w-5" />
      
      {itemCount > 0 && (
        <div 
          className={cn(
            "absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground transition-all",
            highlighted && "animate-bounce"
          )}
        >
          {itemCount}
        </div>
      )}
    </div>
  );
};

export default CartIndicator;