import { useEffect } from 'react';
import { Link } from 'wouter';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/use-auth';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const PaymentSuccessPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  // Use a useEffect to handle any post-payment operations
  // For example, you might want to refresh user data to update subscription status
  useEffect(() => {
    // Any post-payment cleanup or data refresh
  }, []);

  return (
    <div className="container mx-auto px-4 py-12 max-w-md">
      <Card className="bg-background-elevated border-border">
        <CardHeader className="text-center pb-8">
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">{t('cart.orderConfirmed')}</CardTitle>
          <CardDescription>
            {user?.email && t('cart.receiptSent') + ' ' + user.email}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-8">
          <Alert variant="default" className="bg-background border-primary/20">
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
            <Link href="/library/purchased">
              {t('cart.viewPurchases')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/store">{t('cart.continueShopping')}</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PaymentSuccessPage;