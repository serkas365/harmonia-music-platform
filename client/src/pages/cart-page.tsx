import { useState } from 'react';
import { useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { useCartStore, CartItem } from '@/stores/useCartStore';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingBasket, CreditCard, Smartphone, Trash2, ArrowRight } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';

const CartItemRow = ({ item, onRemove }: { item: CartItem; onRemove: () => void }) => {
  return (
    <div className="flex items-center py-3 group">
      <div className="flex flex-1 items-center gap-3">
        <Avatar className="h-12 w-12 rounded-md border bg-background">
          {item.coverImage ? (
            <img 
              src={item.coverImage} 
              alt={item.title} 
              className="object-cover" 
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted text-xs">
              {item.type === 'track' ? 'TRACK' : 'ALBUM'}
            </div>
          )}
        </Avatar>
        <div className="space-y-1">
          <h4 className="font-medium leading-none">{item.title}</h4>
          <p className="text-sm text-muted-foreground">{item.artistName}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-base font-semibold tabular-nums">
          ${(item.price / 100).toFixed(2)}
        </div>
        <button
          onClick={onRemove}
          className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
          aria-label="Remove item"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

const EmptyCart = () => {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center">
      <div className="rounded-full bg-muted p-6">
        <ShoppingBasket className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold">{t('cart.cartEmpty')}</h3>
      <p className="text-muted-foreground max-w-md">
        {t('cart.browseStore')}
      </p>
      <Button onClick={() => navigate('/store')} className="mt-4">
        {t('cart.goToStore')}
      </Button>
    </div>
  );
};

export default function CartPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { items, totalAmount, removeItem } = useCartStore();
  const [paymentTab, setPaymentTab] = useState('card');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleCheckout = async () => {
    if (items.length === 0) return;
    
    // Direct to the checkout page for Stripe integration
    navigate('/checkout');
  };
  
  const handleMobileCheckout = () => {
    toast({
      title: t('cart.processingPayment'),
      description: t('cart.mobilePaymentProcessing'),
    });
  };
  
  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <PageHeader 
          title={t('cart.yourCart')} 
          icon={<ShoppingBasket className="h-6 w-6" />}
        />
        <EmptyCart />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-6">
      <PageHeader 
        title={t('cart.yourCart')} 
        icon={<ShoppingBasket className="h-6 w-6" />}
        subtitle={t('cart.cartItems', { count: items.length })}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-6">
        <div className="md:col-span-2">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">{t('cart.item')}</h3>
              </div>
              
              <div className="mt-6 space-y-2 divide-y">
                {items.map((item) => (
                  <CartItemRow 
                    key={`${item.type}-${item.id}`} 
                    item={item} 
                    onRemove={() => removeItem(item.id, item.type)}
                  />
                ))}
              </div>
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
              
              <div className="mt-6">
                <h4 className="font-medium mb-3">{t('cart.paymentMethod')}</h4>
                
                <Tabs
                  defaultValue="card"
                  value={paymentTab}
                  onValueChange={setPaymentTab}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="card">
                      <CreditCard className="mr-2 h-4 w-4" />
                      {t('cart.creditCard')}
                    </TabsTrigger>
                    <TabsTrigger value="mobile">
                      <Smartphone className="mr-2 h-4 w-4" />
                      {t('cart.mobilePayment')}
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="card">
                    <Button 
                      className="w-full mt-4" 
                      onClick={handleCheckout}
                      disabled={isSubmitting}
                    >
                      {t('cart.checkout')}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </TabsContent>
                  
                  <TabsContent value="mobile">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>{t('cart.mobileNumber')}</Label>
                        <Input
                          type="tel"
                          placeholder={t('cart.mobilePlaceholder')}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('cart.provider')}</Label>
                        <RadioGroup defaultValue="mpesa">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="mpesa" id="mpesa" />
                            <Label htmlFor="mpesa" className="cursor-pointer">
                              {t('cart.mPesa')}
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="airtel" id="airtel" />
                            <Label htmlFor="airtel" className="cursor-pointer">
                              {t('cart.airtelMoney')}
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="mtn" id="mtn" />
                            <Label htmlFor="mtn" className="cursor-pointer">
                              {t('cart.mtnMoney')}
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="orange" id="orange" />
                            <Label htmlFor="orange" className="cursor-pointer">
                              {t('cart.orangeMoney')}
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>
                      
                      <Button 
                        className="w-full mt-4" 
                        onClick={handleMobileCheckout}
                        disabled={isSubmitting}
                      >
                        {t('cart.checkout')}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                      
                      <p className="text-xs text-muted-foreground text-center mt-2">
                        {t('cart.mobilePaymentProcessing')}
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}