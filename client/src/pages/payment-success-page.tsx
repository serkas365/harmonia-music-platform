import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { CheckCircle, Music, Home, Package } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

export default function PaymentSuccessPage() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  
  useEffect(() => {
    // If someone navigates directly to this page, redirect to home
    const hasNavigatedFromCheckout = document.referrer.includes('/checkout');
    if (!hasNavigatedFromCheckout && typeof window !== 'undefined') {
      const timeoutId = setTimeout(() => {
        navigate('/');
      }, 3000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [navigate]);
  
  const handleContinueShopping = () => {
    navigate('/store');
  };
  
  const handleGoToLibrary = () => {
    navigate('/library/purchased');
  };
  
  const handleGoHome = () => {
    navigate('/');
  };
  
  return (
    <div className="container mx-auto px-4 py-16 flex flex-col items-center text-center">
      <div className="w-full max-w-md flex flex-col items-center">
        <div className="bg-primary/10 p-6 rounded-full mb-6">
          <CheckCircle className="h-16 w-16 text-primary" />
        </div>
        
        <h1 className="text-3xl font-bold mb-4">{t('payment.thankYou')}</h1>
        <p className="text-xl mb-2">{t('payment.orderConfirmed')}</p>
        <p className="text-muted-foreground mb-8">
          {t('payment.confirmationEmail', { email: user?.email })}
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          <div className="bg-card border rounded-lg p-5">
            <Package className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-semibold text-lg mb-1">{t('payment.yourPurchase')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('payment.availableLibrary')}
            </p>
            <Button
              onClick={handleGoToLibrary}
              className="mt-4 w-full"
              variant="outline"
            >
              <Music className="mr-2 h-4 w-4" />
              {t('payment.viewLibrary')}
            </Button>
          </div>
          
          <div className="bg-card border rounded-lg p-5">
            <Home className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-semibold text-lg mb-1">{t('payment.whatNext')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('payment.explorePlatform')}
            </p>
            <Button
              onClick={handleGoHome}
              className="mt-4 w-full"
              variant="outline"
            >
              <Home className="mr-2 h-4 w-4" />
              {t('payment.backToHome')}
            </Button>
          </div>
        </div>
        
        <Button
          onClick={handleContinueShopping}
          className="mt-8 w-full"
        >
          {t('payment.continueShopping')}
        </Button>
      </div>
    </div>
  );
}