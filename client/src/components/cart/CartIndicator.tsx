import { useEffect, useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useCartStore } from '@/stores/useCartStore';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { useTranslation } from 'react-i18next';

interface CartIndicatorProps {
  className?: string;
  variant?: 'default' | 'minimal';
}

const CartIndicator = ({ 
  className, 
  variant = 'default' 
}: CartIndicatorProps) => {
  const { t } = useTranslation();
  const [location] = useLocation();
  const items = useCartStore((state) => state.items);
  const [isPulsing, setIsPulsing] = useState(false);
  const totalAmount = useCartStore((state) => state.totalAmount);
  
  // Format price from cents to dollars
  const formattedTotal = (totalAmount / 100).toFixed(2);
  
  // Pulse animation when items are added to cart
  const itemCount = items.length;
  useEffect(() => {
    if (itemCount > 0) {
      setIsPulsing(true);
      const timer = setTimeout(() => setIsPulsing(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [itemCount]);

  if (variant === 'minimal') {
    return (
      <div className={cn("relative", className)}>
        <ShoppingCart className="h-5 w-5" />
        {itemCount > 0 && (
          <Badge 
            variant="default" 
            className={cn(
              "absolute -top-2 -right-2 h-4 w-4 p-0 flex items-center justify-center rounded-full text-[10px]",
              isPulsing && "animate-pulse"
            )}
          >
            {itemCount}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link href="/cart">
            <a
              className={cn(
                "relative flex items-center p-2 rounded-full hover:bg-background-highlight bg-transparent transition-colors",
                location === '/cart' && "text-primary",
                className
              )}
            >
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <Badge 
                  variant="default" 
                  className={cn(
                    "absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center rounded-full text-[10px]",
                    isPulsing && "animate-pulse"
                  )}
                >
                  {itemCount}
                </Badge>
              )}
            </a>
          </Link>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <div className="py-1">
            {itemCount > 0 ? (
              <div>
                <div className="font-medium">{t('cart.cartItems', { count: itemCount })}</div>
                <div className="text-xs">{t('cart.total')}: ${formattedTotal}</div>
              </div>
            ) : (
              <div>{t('cart.cartEmpty')}</div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default CartIndicator;