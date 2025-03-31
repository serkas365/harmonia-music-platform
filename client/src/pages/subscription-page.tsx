import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@tanstack/react-query';
import { PageHeader } from '@/components/PageHeader';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import { Check, Crown, Loader2, Music, Shield, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { SubscriptionPlan } from '@shared/schema';
import { useState } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { Badge } from '@/components/ui/badge';

const PlanCard = ({ 
  plan, 
  isCurrentPlan, 
  onSelect,
  isProcessing 
}: { 
  plan: SubscriptionPlan; 
  isCurrentPlan: boolean; 
  onSelect: (plan: SubscriptionPlan) => void;
  isProcessing: boolean;
}) => {
  const { t } = useTranslation();
  
  const planIcons = {
    'Free': Music,
    'Premium': Shield,
    'Ultimate': Crown
  };
  
  const PlanIcon = planIcons[plan.name as keyof typeof planIcons] || Music;
  
  const formatPrice = (price: number) => {
    if (price === 0) return t('subscription.free');
    return `$${(price / 100).toFixed(2)}`;
  };
  
  const backgroundClass = plan.name === 'Free' ? 'bg-background-elevated' : 
    plan.name === 'Premium' ? 'bg-primary/10' : 'bg-primary/20';

  return (
    <Card className={`w-full ${backgroundClass} transition-all duration-200 ${isCurrentPlan ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <CardTitle className="text-xl flex items-center">
              <PlanIcon className={`mr-2 h-5 w-5 ${plan.name !== 'Free' ? 'text-primary' : ''}`} />
              {plan.name}
            </CardTitle>
            <div className="mt-1 flex items-center">
              <span className="text-3xl font-bold">{formatPrice(plan.price)}</span>
              {plan.price > 0 && (
                <span className="text-sm text-muted-foreground ml-1">/{t(`subscription.per${plan.interval}`)}</span>
              )}
            </div>
          </div>
          {isCurrentPlan && (
            <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30">
              {t('subscription.currentPlan')}
            </Badge>
          )}
        </div>
        <CardDescription className="mt-2">
          {plan.name === 'Free' ? t('subscription.freeDescription') : 
           plan.name === 'Premium' ? t('subscription.premiumDescription') : 
           t('subscription.ultimateDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-4">
        <h4 className="text-sm font-medium mb-3">{t('subscription.includes')}</h4>
        <ul className="space-y-2">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <Check className="h-4 w-4 text-primary mr-2 mt-0.5" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          variant={isCurrentPlan ? "outline" : (plan.name === 'Ultimate' ? "default" : "secondary")}
          onClick={() => onSelect(plan)}
          disabled={isCurrentPlan || isProcessing}
        >
          {isProcessing ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('subscription.processing')}</>
          ) : (
            isCurrentPlan ? t('subscription.currentPlan') : t('subscription.selectPlan')
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

// Define the interface for the subscription response
interface UserSubscriptionResponse {
  active: boolean;
  planId?: number;
}

const SubscriptionPage = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  
  const { 
    data: plans = [], 
    isLoading: isLoadingPlans, 
    error: plansError 
  } = useQuery<SubscriptionPlan[]>({
    queryKey: ['/api/subscription-plans'],
  });
  
  const { 
    data: userSubscription = { active: false },
    isLoading: isLoadingSubscription,
  } = useQuery<UserSubscriptionResponse>({
    queryKey: ['/api/me/subscription'],
  });
  
  const subscriptionMutation = useMutation({
    mutationFn: async (planId: number) => {
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
      setTimeout(() => setLocation('/'), 1500);
    },
    onError: (error: Error) => {
      toast({
        title: t('subscription.updateError'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  const isCurrentPlan = (plan: SubscriptionPlan) => {
    // If user has a subscription, check if it matches the plan
    if (userSubscription.active && userSubscription.planId === plan.id) {
      return true;
    }
    
    // Otherwise, check user's current tier matches the plan name
    if (user && !userSubscription.active) {
      return user.subscriptionTier.toLowerCase() === plan.name.toLowerCase();
    }
    
    return false;
  };
  
  const handleSelectPlan = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    
    // If it's not a free plan, redirect to payment page
    if (plan.price > 0) {
      // Navigate to payment page with plan details as URL parameters
      const params = new URLSearchParams({
        planId: plan.id.toString(),
        planName: plan.name,
        planPrice: plan.price.toString()
      });
      
      setLocation(`/subscription-payment?${params.toString()}`);
    } else {
      // For the free plan, just update the subscription directly
      subscriptionMutation.mutate(plan.id);
    }
  };
  
  const isLoading = isLoadingPlans || isLoadingSubscription;
  const isProcessing = subscriptionMutation.isPending;
  
  if (isLoading) {
    return (
      <div className="container px-4 py-6">
        <LoadingSkeleton />
      </div>
    );
  }
  
  return (
    <div className="container px-4 py-6 mb-24">
      <PageHeader
        title={t('subscription.title')}
        subtitle={t('subscription.subtitle')}
        icon={<Sparkles className="h-6 w-6 text-primary" />}
      />
      
      {plansError ? (
        <div className="my-8 text-center">
          <p className="text-red-500">{t('common.error')}</p>
          <Button 
            onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/subscription-plans'] })}
            variant="outline" 
            className="mt-2"
          >
            {t('common.retry')}
          </Button>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isCurrentPlan={isCurrentPlan(plan)}
              onSelect={handleSelectPlan}
              isProcessing={isProcessing}
            />
          ))}
        </div>
      )}
      
      <div className="mt-12 p-6 bg-background-elevated rounded-lg border border-border">
        <h3 className="text-lg font-medium mb-4">{t('subscription.faq')}</h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium">{t('subscription.faqBilling')}</h4>
            <p className="mt-1 text-sm text-muted-foreground">{t('subscription.faqBillingAnswer')}</p>
          </div>
          <div>
            <h4 className="font-medium">{t('subscription.faqCancel')}</h4>
            <p className="mt-1 text-sm text-muted-foreground">{t('subscription.faqCancelAnswer')}</p>
          </div>
          <div>
            <h4 className="font-medium">{t('subscription.faqChange')}</h4>
            <p className="mt-1 text-sm text-muted-foreground">{t('subscription.faqChangeAnswer')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;