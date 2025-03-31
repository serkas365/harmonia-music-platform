import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { useCartStore } from "@/stores/useCartStore";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { 
  ShoppingBag, 
  X, 
  CreditCard, 
  AlertCircle,
  ArrowLeft,
  ShieldCheck,
  Smartphone
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

// Form validation schema for checkout
const checkoutSchema = z.object({
  cardName: z.string().min(3, { message: "Name must be at least 3 characters." }).optional(),
  cardNumber: z.string().regex(/^[0-9]{16}$/, { message: "Please enter a valid 16-digit credit card number." }).optional(),
  cardExpiry: z.string().regex(/^(0[1-9]|1[0-2])\/[0-9]{2}$/, { message: "Please use MM/YY format." }).optional(),
  cardCVC: z.string().regex(/^[0-9]{3,4}$/, { message: "Please enter a valid CVC code." }).optional(),
  mobileNumber: z.string().regex(/^\+[0-9]{10,15}$/, { message: "Please enter a valid mobile number with country code." }).optional(),
  mobileProvider: z.enum(["mpesa", "airtel", "mtn", "orange"]).optional(),
  paymentMethod: z.enum(["card", "mobile", "paypal"], { required_error: "Please select a payment method." }),
}).refine(data => {
  if (data.paymentMethod === 'card') {
    return !!data.cardName && !!data.cardNumber && !!data.cardExpiry && !!data.cardCVC;
  }
  if (data.paymentMethod === 'mobile') {
    return !!data.mobileNumber && !!data.mobileProvider;
  }
  return true;
}, {
  message: "Please fill in all required fields for the selected payment method.",
  path: ["paymentMethod"],
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

const CartPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { items, totalAmount, removeItem, clearCart } = useCartStore();
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'payment' | 'confirmation'>('cart');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const formatPrice = (price: number) => {
    return (price / 100).toFixed(2);
  };

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      cardName: "",
      cardNumber: "",
      cardExpiry: "",
      cardCVC: "",
      mobileNumber: "",
      mobileProvider: "mpesa",
      paymentMethod: "card",
    },
  });

  const onSubmit = (data: CheckoutFormValues) => {
    setIsProcessing(true);
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      setCheckoutStep('confirmation');
      // Display success toast
      toast({
        title: "Payment successful!",
        description: "Your purchase has been completed.",
      });
      // Clear cart after successful purchase
      clearCart();
    }, 2000);
  };

  if (items.length === 0 && checkoutStep !== 'confirmation') {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">{t('cart.yourCart')}</h1>
        <div className="bg-background-elevated rounded-lg p-8 text-center">
          <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">{t('cart.cartEmpty')}</h2>
          <p className="text-muted-foreground mb-6">{t('cart.browseStore')}</p>
          <Button asChild>
            <Link href="/store">{t('cart.goToStore')}</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (checkoutStep === 'confirmation') {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="bg-background-elevated border-border">
          <CardHeader className="text-center pb-8">
            <div className="mx-auto bg-primary/10 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
              <ShieldCheck className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">{t('cart.orderConfirmed')}</CardTitle>
            <CardDescription>{t('cart.receiptSent')} {user?.email}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-8">
            <Alert variant="default" className="bg-background border-primary/20">
              <AlertCircle className="h-4 w-4 text-primary" />
              <AlertTitle>{t('cart.orderProcessing')}</AlertTitle>
              <AlertDescription>
                {t('cart.deliveredSoon')}
              </AlertDescription>
            </Alert>
            
            <div className="space-y-1 pt-4">
              <h3 className="font-medium">{t('cart.downloadInstructions')}</h3>
              <p className="text-sm text-muted-foreground">{t('cart.accessLibrary')}</p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 pt-6">
            <Button asChild className="w-full">
              <Link href="/library/purchased">{t('cart.viewPurchases')}</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/">{t('cart.continueShopping')}</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {checkoutStep === 'cart' ? (
        <>
          <h1 className="text-3xl font-bold mb-6">{t('cart.yourCart')}</h1>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-background-elevated rounded-lg overflow-hidden">
                <div className="grid grid-cols-[auto,1fr,auto] gap-4 p-4 border-b border-border font-medium">
                  <div className="col-span-2">{t('cart.item')}</div>
                  <div className="text-right">{t('cart.price')}</div>
                </div>
                
                <div className="divide-y divide-border">
                  {items.map((item) => (
                    <div key={`${item.type}-${item.id}`} className="grid grid-cols-[80px,1fr,auto] gap-4 p-4">
                      <div className="w-20 h-20 bg-background-highlight rounded overflow-hidden">
                        {item.coverImage ? (
                          <img 
                            src={item.coverImage} 
                            alt={item.title} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            {item.type === 'album' ? (
                              <ShoppingBag className="h-6 w-6 text-muted-foreground" />
                            ) : (
                              <ShoppingBag className="h-6 w-6 text-muted-foreground" />
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col justify-center">
                        <h3 className="font-medium">{item.title}</h3>
                        <div className="text-sm text-muted-foreground">
                          <span>{item.artistName}</span>
                          <span className="mx-2">•</span>
                          <span className="capitalize">{item.type}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end justify-between">
                        <div className="font-medium">${formatPrice(item.price)}</div>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => removeItem(item.id, item.type)}
                          className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-background-elevated rounded-lg p-6 sticky top-4">
                <h2 className="text-xl font-bold mb-4">{t('cart.orderSummary')}</h2>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('cart.subtotal')}</span>
                    <span>${formatPrice(totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('cart.tax')}</span>
                    <span>${formatPrice(totalAmount * 0.1)}</span>
                  </div>
                  <Separator className="my-4" />
                  <div className="flex justify-between font-bold">
                    <span>{t('cart.total')}</span>
                    <span>${formatPrice(totalAmount * 1.1)}</span>
                  </div>
                </div>
                
                <Button 
                  className="w-full mb-4" 
                  onClick={() => setCheckoutStep('payment')}
                >
                  {t('cart.checkout')}
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full" 
                  asChild
                >
                  <Link href="/store">{t('cart.continueShopping')}</Link>
                </Button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="max-w-2xl mx-auto">
          <Button 
            variant="ghost" 
            className="mb-6" 
            onClick={() => setCheckoutStep('cart')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('cart.backToCart')}
          </Button>
          
          <h1 className="text-3xl font-bold mb-6">{t('cart.checkout')}</h1>
          
          <div className="bg-background-elevated rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">{t('cart.orderSummary')}</h2>
            <div className="space-y-2 mb-4">
              {items.map((item) => (
                <div key={`${item.type}-${item.id}`} className="flex justify-between">
                  <span className="text-muted-foreground">{item.title} ({item.type})</span>
                  <span>${formatPrice(item.price)}</span>
                </div>
              ))}
            </div>
            
            <Separator className="my-4" />
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('cart.subtotal')} ({items.length} {items.length === 1 ? t('cart.item') : t('cart.items')})</span>
                <span>${formatPrice(totalAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('cart.tax')}</span>
                <span>${formatPrice(totalAmount * 0.1)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>{t('cart.total')}</span>
                <span>${formatPrice(totalAmount * 1.1)}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-background-elevated rounded-lg p-6">
            <h2 className="text-xl font-bold mb-6">{t('cart.paymentMethod')}</h2>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-3"
                        >
                          <div className="flex items-center space-x-2 border border-border rounded-lg p-4 cursor-pointer data-[state=checked]:border-primary">
                            <RadioGroupItem value="card" id="card" />
                            <Label htmlFor="card" className="flex-1 cursor-pointer">
                              <div className="flex items-center">
                                <CreditCard className="h-5 w-5 mr-2" />
                                {t('cart.creditCard')}
                              </div>
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2 border border-border rounded-lg p-4 cursor-pointer data-[state=checked]:border-primary">
                            <RadioGroupItem value="mobile" id="mobile" />
                            <Label htmlFor="mobile" className="flex-1 cursor-pointer">
                              <div className="flex items-center">
                                <Smartphone className="h-5 w-5 mr-2" />
                                {t('cart.mobilePayment')}
                              </div>
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2 border border-border rounded-lg p-4 cursor-pointer data-[state=checked]:border-primary opacity-60">
                            <RadioGroupItem value="paypal" id="paypal" disabled />
                            <Label htmlFor="paypal" className="flex-1 cursor-pointer opacity-60">
                              <div className="flex items-center">
                                <span className="font-bold text-blue-500 mr-1">Pay</span>
                                <span className="font-bold text-blue-800">Pal</span>
                                <span className="ml-2 text-muted-foreground text-xs">({t('cart.comingSoon')})</span>
                              </div>
                            </Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch("paymentMethod") === "card" && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="cardName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('cart.nameOnCard')}</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="cardNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('cart.cardNumber')}</FormLabel>
                          <FormControl>
                            <Input placeholder="1234 5678 9012 3456" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="cardExpiry"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('cart.expiry')}</FormLabel>
                            <FormControl>
                              <Input placeholder="MM/YY" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="cardCVC"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('cart.cvc')}</FormLabel>
                            <FormControl>
                              <Input placeholder="123" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}
                
                {form.watch("paymentMethod") === "mobile" && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="mobileNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('cart.mobileNumber')}</FormLabel>
                          <FormControl>
                            <Input placeholder={t('cart.mobilePlaceholder')} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="mobileProvider"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('cart.provider')}</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="grid grid-cols-2 gap-2 pt-2"
                            >
                              <div className="flex items-center space-x-2 border border-border rounded-lg p-3 cursor-pointer data-[state=checked]:border-primary">
                                <RadioGroupItem value="mpesa" id="mpesa" />
                                <Label htmlFor="mpesa" className="text-sm">{t('cart.mPesa')}</Label>
                              </div>
                              <div className="flex items-center space-x-2 border border-border rounded-lg p-3 cursor-pointer data-[state=checked]:border-primary">
                                <RadioGroupItem value="airtel" id="airtel" />
                                <Label htmlFor="airtel" className="text-sm">{t('cart.airtelMoney')}</Label>
                              </div>
                              <div className="flex items-center space-x-2 border border-border rounded-lg p-3 cursor-pointer data-[state=checked]:border-primary">
                                <RadioGroupItem value="mtn" id="mtn" />
                                <Label htmlFor="mtn" className="text-sm">{t('cart.mtnMoney')}</Label>
                              </div>
                              <div className="flex items-center space-x-2 border border-border rounded-lg p-3 cursor-pointer data-[state=checked]:border-primary">
                                <RadioGroupItem value="orange" id="orange" />
                                <Label htmlFor="orange" className="text-sm">{t('cart.orangeMoney')}</Label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                          <FormDescription className="text-xs mt-2">{t('cart.mobilePaymentProcessing')}</FormDescription>
                        </FormItem>
                      )}
                    />
                  </div>
                )}
                
                <div className="pt-4">
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isProcessing}
                  >
                    {isProcessing ? t('cart.processing') : t('cart.completeOrder')}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;