import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Redirect } from 'wouter';
import { ArtistAnalytics, ArtistFollower } from '@shared/schema';
import { Loader2, TrendingUp, Users, User, Calendar } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';

const ArtistDashboardPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year' | 'all'>('month');

  // Redirect if not an artist
  if (!user || user.role !== 'artist') {
    return <Redirect to="/" />;
  }

  // Analytics data
  const {
    data: analytics,
    isLoading: analyticsLoading,
    error: analyticsError,
  } = useQuery<ArtistAnalytics[]>({
    queryKey: ['/api/artist-dashboard/analytics', period],
    queryFn: async () => {
      const res = await fetch(`/api/artist-dashboard/analytics?period=${period}`);
      if (!res.ok) throw new Error('Failed to fetch analytics');
      return res.json();
    },
  });

  // Followers data
  const {
    data: followers,
    isLoading: followersLoading,
    error: followersError,
  } = useQuery<ArtistFollower[]>({
    queryKey: ['/api/artist-dashboard/followers'],
    queryFn: async () => {
      const res = await fetch('/api/artist-dashboard/followers');
      if (!res.ok) throw new Error('Failed to fetch followers');
      return res.json();
    },
  });

  // Aggregate analytics data
  const aggregatedAnalytics = analytics?.reduce(
    (acc, item) => {
      acc.totalStreams += item.streamCount;
      acc.totalPurchases += item.purchaseCount;
      acc.totalRevenue += item.revenue;
      return acc;
    },
    { totalStreams: 0, totalPurchases: 0, totalRevenue: 0 }
  ) || { totalStreams: 0, totalPurchases: 0, totalRevenue: 0 };

  if (!user.artistId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">{t('common.artistDashboard')}</h1>
        <p>{t('artistDashboard.needArtistProfile')}</p>
      </div>
    );
  }

  if (analyticsLoading || followersLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (analyticsError || followersError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">{t('common.artistDashboard')}</h1>
        <p className="text-destructive">
          {t('artistDashboard.errorLoading')}
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">{t('common.artistDashboard')}</h1>
        <div className="mt-4 md:mt-0">
          <Select value={period} onValueChange={(value) => setPeriod(value as typeof period)}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder={t('artistDashboard.selectPeriod')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">{t('artistDashboard.day')}</SelectItem>
              <SelectItem value="week">{t('artistDashboard.week')}</SelectItem>
              <SelectItem value="month">{t('artistDashboard.month')}</SelectItem>
              <SelectItem value="year">{t('artistDashboard.year')}</SelectItem>
              <SelectItem value="all">{t('artistDashboard.allTime')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('artistDashboard.totalStreams')}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {aggregatedAnalytics.totalStreams.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('artistDashboard.totalPurchases')}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {aggregatedAnalytics.totalPurchases.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('artistDashboard.totalRevenue')}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(aggregatedAnalytics.totalRevenue / 100).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Followers */}
      <div className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle>{t('artistDashboard.followers')}</CardTitle>
            <CardDescription>
              {t('artistDashboard.youHaveFollowers', { count: followers?.length || 0 })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {followers && followers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('artistDashboard.userId')}</TableHead>
                    <TableHead>{t('artistDashboard.followedSince')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {followers.slice(0, 5).map((follower) => (
                    <TableRow key={follower.userId}>
                      <TableCell>{follower.userId}</TableCell>
                      <TableCell>
                        {formatDistanceToNow(new Date(follower.followedAt), { addSuffix: true })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                {followers.length > 5 && (
                  <TableCaption>
                    {t('artistDashboard.showing', { count: followers.length })}
                  </TableCaption>
                )}
              </Table>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                {t('artistDashboard.noFollowersYet')}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Analytics Detail */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle>{t('artistDashboard.performanceAnalytics')}</CardTitle>
            <CardDescription>
              {t('artistDashboard.detailedAnalytics')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analytics && analytics.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('artistDashboard.date')}</TableHead>
                    <TableHead>{t('artistDashboard.period')}</TableHead>
                    <TableHead className="text-right">{t('artistDashboard.streams')}</TableHead>
                    <TableHead className="text-right">{t('artistDashboard.purchases')}</TableHead>
                    <TableHead className="text-right">{t('artistDashboard.revenue')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {new Date(item.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{item.period}</TableCell>
                      <TableCell className="text-right">{item.streamCount}</TableCell>
                      <TableCell className="text-right">{item.purchaseCount}</TableCell>
                      <TableCell className="text-right">
                        ${(item.revenue / 100).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                {t('artistDashboard.noAnalyticsData')}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ArtistDashboardPage;