import { useEffect, useState } from 'react';
import { useLocation, useRouter } from 'wouter';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useTranslation } from 'react-i18next';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { useCartStore } from '@/stores/useCartStore';
import { StripeCheckoutForm } from '@/components/checkout/StripeCheckoutForm';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  ArrowLeft, 
  CreditCard, 
  ShieldCheck,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

// Initialize Stripe outside of the component to avoid recreating it on each render
const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

const CheckoutPage = () => {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { items, totalAmount, clearCart } = useCartStore();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoadingIntent, setIsLoadingIntent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If cart is empty, redirect back to cart page
    if (items.length === 0) {
      navigate('/cart');
      return;
    }

    // If user is not authenticated, redirect to login
    if (!user) {
      navigate('/auth?redirect=/checkout');
      return;
    }

    // Create a payment intent as soon as the page loads
    const createPaymentIntent = async () => {
      setIsLoadingIntent(true);
      setError(null);

      try {
        // Verify Stripe is configured
        if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
          throw new Error('Stripe is not configured. Please add VITE_STRIPE_PUBLIC_KEY to your environment variables.');
        }

        // Create payment intent
        const response = await apiRequest('POST', '/api/create-payment-intent', { 
          items, 
          amount: totalAmount 
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to create payment intent');
        }

        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (err: any) {
        console.error('Error creating payment intent:', err);
        setError(err.message || 'Failed to create payment intent');
      } finally {
        setIsLoadingIntent(false);
      }
    };

    createPaymentIntent();
  }, [items, totalAmount, navigate, user]);

  const handlePaymentSuccess = () => {
    // Process successful payment
    clearCart();
    navigate('/payment-success');
  };

  if (isLoadingIntent || !clientSecret) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary" />
          <p className="mt-4 text-lg">{t('cart.preparingCheckout')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="bg-destructive/10 border border-destructive rounded-lg p-6 mb-8 text-center">
          <div className="text-destructive font-medium mb-2">{t('cart.checkoutError')}</div>
          <p className="text-sm">{error}</p>
        </div>
        <Button onClick={() => navigate('/cart')} className="w-full" variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('cart.backToCart')}
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Button onClick={() => navigate('/cart')} className="mb-6" variant="ghost">
        <ArrowLeft className="mr-2 h-4 w-4" />
        {t('cart.backToCart')}
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="order-2 md:order-1">
          <Card className="mb-8">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl flex items-center">
                <CreditCard className="mr-2 h-5 w-5" />
                {t('cart.paymentInformation')}
              </CardTitle>
              <CardDescription>
                {t('cart.securePaymentDescription')}
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {stripePromise ? (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <StripeCheckoutForm 
                    clientSecret={clientSecret} 
                    amount={totalAmount} 
                    onSuccess={handlePaymentSuccess} 
                  />
                </Elements>
              ) : (
                <div className="p-4 border border-destructive rounded-md bg-destructive/10 text-center">
                  <p className="text-destructive">
                    {t('cart.stripeNotConfigured')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <div className="flex items-center justify-center text-sm text-muted-foreground mb-6">
            <ShieldCheck className="h-4 w-4 mr-2" />
            {t('cart.secureTransaction')}
          </div>
        </div>

        <div className="order-1 md:order-2">
          <Card>
            <CardHeader>
              <CardTitle>{t('cart.orderSummary')}</CardTitle>
              <CardDescription>
                {t('cart.itemCount', { count: items.length })}
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={`${item.type}-${item.id}`} className="flex justify-between items-center text-sm">
                    <div className="flex-1">
                      <div className="font-medium">{item.title}</div>
                      <div className="text-muted-foreground text-xs">{item.artistName}</div>
                    </div>
                    <div>${item.price.toFixed(2)}</div>
                  </div>
                ))}
                
                <Separator />
                
                <div className="flex justify-between items-center pt-2">
                  <span className="font-medium">{t('cart.subtotal')}</span>
                  <span>${totalAmount.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>{t('cart.tax')}</span>
                  <span>{t('cart.includedInPrice')}</span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between items-center font-bold">
                  <span>{t('cart.total')}</span>
                  <span>${totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;