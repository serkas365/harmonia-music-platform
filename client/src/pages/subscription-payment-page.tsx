import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/PageHeader';
import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useMutation } from '@tanstack/react-query';
import { Shield, LockKeyhole, CreditCard, Smartphone, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const SubscriptionPaymentPage = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Payment form state
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCvc] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Mobile payment state
  const [mobileNumber, setMobileNumber] = useState('');
  const [mobileProvider, setMobileProvider] = useState('');
  const [activeTab, setActiveTab] = useState<string>('credit-card');
  
  // Read subscription plan from URL query parameters
  const params = new URLSearchParams(window.location.search);
  const planId = parseInt(params.get('planId') || '0');
  const planName = params.get('planName') || '';
  const planPrice = parseInt(params.get('planPrice') || '0');
  
  useEffect(() => {
    // If no plan ID, redirect back to subscription page
    if (!planId) {
      setLocation('/subscriptions');
    }
  }, [planId, setLocation]);
  
  // Handle card number formatting (add spaces after every 4 digits)
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const formattedValue = value.replace(/\B(?=(\d{4})+(?!\d))/g, ' ');
    if (formattedValue.length <= 19) { // 16 digits + 3 spaces
      setCardNumber(formattedValue);
    }
  };
  
  // Handle expiry date formatting (add slash after month)
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    
    if (value.length <= 2) {
      setCardExpiry(value);
    } else if (value.length <= 4) {
      setCardExpiry(`${value.slice(0, 2)}/${value.slice(2)}`);
    }
  };
  
  // Handle CVC formatting
  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (value.length <= 3) {
      setCvc(value);
    }
  };
  
  // Handle mobile number formatting
  const handleMobileNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\s+/g, '').replace(/[^0-9+]/gi, '');
    if (value.length <= 15) {
      setMobileNumber(value);
    }
  };
  
  // Subscription mutation
  const subscriptionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        'POST', 
        '/api/me/subscription', 
        { planId }
      );
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/me/subscription'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      
      toast({
        title: t('subscription.updateSuccess'),
        description: t('subscription.enjoySubscription'),
      });
      
      setTimeout(() => {
        setLocation('/');
      }, 1500);
    },
    onError: (error: Error) => {
      toast({
        title: t('subscription.updateError'),
        description: error.message,
        variant: 'destructive',
      });
      setIsProcessing(false);
    },
  });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsProcessing(true);
    
    // For both payment methods, we'll use the same subscription mutation
    // In a real application, we would handle the different payment methods differently
    // and pass the payment method to the API
    
    // For mobile payment, we would include the mobile payment details
    const paymentMethod = activeTab === 'mobile-payment' 
      ? { type: 'mobile', provider: mobileProvider, number: mobileNumber }
      : { type: 'credit_card', name: cardName, number: cardNumber };
    
    toast({
      title: activeTab === 'mobile-payment' 
        ? 'Mobile Payment Processing' 
        : 'Credit Card Processing',
      description: 'Processing your payment...',
    });
    
    // We're using a simplified demo without actual payment processing
    subscriptionMutation.mutate();
  };
  
  const validateForm = () => {
    if (activeTab === 'credit-card') {
      if (!cardName) {
        toast({
          title: t('checkout.errorTitle'),
          description: t('checkout.nameRequired'),
          variant: 'destructive',
        });
        return false;
      }
      
      if (cardNumber.replace(/\s/g, '').length !== 16) {
        toast({
          title: t('checkout.errorTitle'),
          description: t('checkout.cardNumberInvalid'),
          variant: 'destructive',
        });
        return false;
      }
      
      if (cardExpiry.length !== 5) {
        toast({
          title: t('checkout.errorTitle'),
          description: t('checkout.expiryInvalid'),
          variant: 'destructive',
        });
        return false;
      }
      
      if (cardCvc.length !== 3) {
        toast({
          title: t('checkout.errorTitle'),
          description: t('checkout.cvcInvalid'),
          variant: 'destructive',
        });
        return false;
      }
    } else if (activeTab === 'mobile-payment') {
      if (mobileNumber.length < 10) {
        toast({
          title: t('checkout.errorTitle'),
          description: t('cart.mobileNumber') + ' ' + t('checkout.errorTitle').toLowerCase(),
          variant: 'destructive',
        });
        return false;
      }
      
      if (!mobileProvider) {
        toast({
          title: t('checkout.errorTitle'),
          description: t('cart.provider') + ' ' + t('checkout.errorTitle').toLowerCase(),
          variant: 'destructive',
        });
        return false;
      }
    }
    
    return true;
  };
  
  if (!planId) {
    return <LoadingSkeleton />;
  }
  
  return (
    <div className="container px-4 py-6 max-w-4xl mx-auto">
      <PageHeader
        title={t('subscription.paymentTitle')}
        subtitle={t('subscription.paymentSubtitle')}
        icon={<Shield className="h-6 w-6 text-primary" />}
      />
      
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="mr-2 h-5 w-5" />
                {t('checkout.paymentDetails')}
              </CardTitle>
              <CardDescription>
                {t('checkout.secureConnection')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit}>
                <Tabs 
                  defaultValue="credit-card" 
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="w-full mb-6"
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="credit-card" className="flex items-center">
                      <CreditCard className="mr-2 h-4 w-4" />
                      {t('cart.creditCard')}
                    </TabsTrigger>
                    <TabsTrigger value="mobile-payment" className="flex items-center">
                      <Smartphone className="mr-2 h-4 w-4" />
                      {t('cart.mobilePayment')}
                    </TabsTrigger>
                  </TabsList>
                  
                  {/* Credit Card Payment Form */}
                  <TabsContent value="credit-card" className="mt-4">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="cardName">{t('checkout.nameOnCard')}</Label>
                        <Input
                          id="cardName"
                          placeholder={t('checkout.namePlaceholder')}
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value)}
                          disabled={isProcessing}
                          className="max-w-lg"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="cardNumber">{t('checkout.cardNumber')}</Label>
                        <Input
                          id="cardNumber"
                          placeholder="4242 4242 4242 4242"
                          value={cardNumber}
                          onChange={handleCardNumberChange}
                          disabled={isProcessing}
                          className="max-w-lg"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="cardExpiry">{t('checkout.expiryDate')}</Label>
                          <Input
                            id="cardExpiry"
                            placeholder="MM/YY"
                            value={cardExpiry}
                            onChange={handleExpiryChange}
                            disabled={isProcessing}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="cardCvc">{t('checkout.cvc')}</Label>
                          <Input
                            id="cardCvc"
                            placeholder="123"
                            value={cardCvc}
                            onChange={handleCvcChange}
                            disabled={isProcessing}
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  {/* Mobile Payment Form */}
                  <TabsContent value="mobile-payment" className="mt-4">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="mobileNumber">{t('cart.mobileNumber')}</Label>
                        <Input
                          id="mobileNumber"
                          placeholder={t('cart.mobilePlaceholder')}
                          value={mobileNumber}
                          onChange={handleMobileNumberChange}
                          disabled={isProcessing}
                          className="max-w-lg"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="mobileProvider">{t('cart.provider')}</Label>
                        <Select
                          disabled={isProcessing}
                          value={mobileProvider}
                          onValueChange={setMobileProvider}
                        >
                          <SelectTrigger className="max-w-lg">
                            <SelectValue placeholder={t('cart.provider')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mpesa">{t('cart.mPesa')}</SelectItem>
                            <SelectItem value="airtel">{t('cart.airtelMoney')}</SelectItem>
                            <SelectItem value="mtn">{t('cart.mtnMoney')}</SelectItem>
                            <SelectItem value="orange">{t('cart.orangeMoney')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="bg-muted p-4 rounded-lg mt-4">
                        <p className="text-sm text-muted-foreground">
                          {t('cart.mobilePaymentProcessing')}
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
                
                <div className="flex items-center mt-8">
                  <Button
                    type="submit"
                    size="lg"
                    disabled={isProcessing}
                    className="ml-auto"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('subscription.processing')}
                      </>
                    ) : (
                      t('subscription.confirmSubscription')
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>{t('subscription.orderSummary')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="font-medium">{planName}</span>
                  <span>${(planPrice / 100).toFixed(2)}/{t(`subscription.permonth`)}</span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between font-semibold">
                  <span>{t('cart.total')}</span>
                  <span>${(planPrice / 100).toFixed(2)}/{t(`subscription.permonth`)}</span>
                </div>
              </div>
              
              <div className="mt-6 bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
                <div className="flex items-start">
                  <LockKeyhole className="h-4 w-4 mr-2 mt-0.5 text-primary" />
                  <p>{t('subscription.paymentSecureInfo')}</p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                onClick={() => setLocation('/subscriptions')}
                className="w-full"
                disabled={isProcessing}
              >
                {t('checkout.backToCart')}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPaymentPage;