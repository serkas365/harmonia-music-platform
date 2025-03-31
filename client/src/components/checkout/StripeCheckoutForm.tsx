import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  useStripe, 
  useElements, 
  PaymentElement,
  AddressElement
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface StripeCheckoutFormProps {
  clientSecret: string;
  amount: number;
  onSuccess: () => void;
}

export const StripeCheckoutForm = ({ amount, onSuccess }: StripeCheckoutFormProps) => {
  const { t } = useTranslation();
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js hasn't loaded yet
      return;
    }

    setIsLoading(true);
    setPaymentError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setPaymentError(submitError.message || t('cart.paymentError'));
      setIsLoading(false);
      return;
    }

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment-success`,
      },
      redirect: 'if_required',
    });

    if (error) {
      setPaymentError(error.message || t('cart.paymentError'));
      toast({
        variant: "destructive",
        title: t('cart.paymentFailed'),
        description: error.message || t('cart.paymentError'),
      });
      setIsLoading(false);
    } else {
      // Payment succeeded
      toast({
        title: t('cart.paymentSuccess'),
        description: t('cart.orderProcessed'),
      });
      
      // Call onSuccess to handle post-payment workflow
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 border rounded-md bg-muted/40">
        <PaymentElement />
      </div>
      
      <div className="p-4 border rounded-md bg-muted/40">
        <AddressElement options={{
          mode: 'shipping',
          fields: {
            phone: 'always',
          },
          validation: {
            phone: {
              required: 'always',
            },
          },
        }} />
      </div>

      {paymentError && (
        <div className="text-destructive text-sm px-1">
          {paymentError}
        </div>
      )}

      <div className="space-y-2">
        <div className="flex justify-between text-sm mb-2">
          <span className="font-medium">{t('cart.total')}</span>
          <span>${amount.toFixed(2)}</span>
        </div>
        
        <Button 
          disabled={!stripe || isLoading} 
          className="w-full"
          type="submit"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('cart.processing')}
            </>
          ) : (
            t('cart.payNow')
          )}
        </Button>
      </div>
    </form>
  );
};