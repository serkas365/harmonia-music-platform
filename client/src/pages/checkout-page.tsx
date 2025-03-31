import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { useCartStore } from '@/stores/useCartStore';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  CreditCard, 
  Calendar, 
  Lock, 
  ArrowLeft, 
  ChevronsRight 
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

export default function CheckoutPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { items, totalAmount, clearCart } = useCartStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [saveCard, setSaveCard] = useState(false);

  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart');
    }
  }, [items, navigate]);

  const handleFormatCardNumber = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/\D/g, '');
    const formatted = input.replace(/(\d{4})/g, '$1 ').trim();
    setCardNumber(formatted.substring(0, 19)); // limit to 16 digits + 3 spaces
  };

  const handleFormatExpiry = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/\D/g, '');
    const formatted = input.replace(/(\d{2})(\d{0,2})/, '$1/$2');
    setCardExpiry(formatted.substring(0, 5)); // limit to MM/YY format
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      clearCart();
      navigate('/payment-success');
    }, 2000);
  };
  
  const validateForm = () => {
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
    
    return true;
  };
  
  return (
    <div className="container mx-auto px-4 py-6">
      <PageHeader 
        title={t('checkout.secureCheckout')} 
        icon={<Lock className="h-6 w-6" />}
        subtitle={t('checkout.enterDetails')}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-6">
        <div className="md:col-span-2">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-1 mb-6">
                <h3 className="text-lg font-semibold flex items-center">
                  <CreditCard className="mr-2 h-5 w-5 text-primary" />
                  {t('checkout.paymentDetails')}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t('checkout.secureConnection')}
                </p>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="cardName">{t('checkout.nameOnCard')}</Label>
                  <Input
                    id="cardName"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder={t('checkout.namePlaceholder')}
                    disabled={isProcessing}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cardNumber">{t('checkout.cardNumber')}</Label>
                  <div className="relative">
                    <Input
                      id="cardNumber"
                      value={cardNumber}
                      onChange={handleFormatCardNumber}
                      placeholder="4242 4242 4242 4242"
                      maxLength={19}
                      disabled={isProcessing}
                    />
                    <CreditCard className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiry">{t('checkout.expiryDate')}</Label>
                    <div className="relative">
                      <Input
                        id="expiry"
                        value={cardExpiry}
                        onChange={handleFormatExpiry}
                        placeholder="MM/YY"
                        maxLength={5}
                        disabled={isProcessing}
                      />
                      <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="cvc">{t('checkout.cvc')}</Label>
                    <Input
                      id="cvc"
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 3))}
                      placeholder="123"
                      maxLength={3}
                      disabled={isProcessing}
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="saveCard" 
                    checked={saveCard} 
                    onCheckedChange={(checked) => setSaveCard(checked as boolean)}
                    disabled={isProcessing}
                  />
                  <Label htmlFor="saveCard" className="text-sm">
                    {t('checkout.saveCard')}
                  </Label>
                </div>
                
                <div className="flex justify-between pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/cart')}
                    disabled={isProcessing}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t('checkout.backToCart')}
                  </Button>
                  
                  <Button 
                    type="submit" 
                    disabled={isProcessing}
                    className="min-w-[150px]"
                  >
                    {isProcessing ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        {t('checkout.processing')}
                      </>
                    ) : (
                      <>
                        {t('checkout.placeOrder')}
                        <ChevronsRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                {t('cart.orderSummary')}
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('cart.subtotal')}</span>
                  <span>${(totalAmount / 100).toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('cart.tax')}</span>
                  <span className="text-muted-foreground text-sm">
                    {t('cart.includedInPrice')}
                  </span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between font-semibold">
                  <span>{t('cart.total')}</span>
                  <span>${(totalAmount / 100).toFixed(2)}</span>
                </div>
              </div>
              
              <div className="mt-6 space-y-2">
                <h4 className="font-medium text-sm">{t('checkout.orderContains')}</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {items.map((item) => (
                    <li key={`${item.type}-${item.id}`} className="flex justify-between">
                      <span>{item.title}</span>
                      <span>${(item.price / 100).toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="mt-6 pt-4 border-t text-xs text-muted-foreground">
                <p>{t('checkout.termsNotice')}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}