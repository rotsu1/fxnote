"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Settings, Crown } from 'lucide-react';

interface SubscriptionBannerProps {
  subscriptionState: 'never_subscribed' | 'active' | 'inactive';
  userId: string;
}

export function SubscriptionBanner({ subscriptionState, userId }: SubscriptionBannerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleManageSubscription = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create portal session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Error creating portal session:', error);
      toast({
        title: 'エラー',
        description: error instanceof Error ? error.message : 'ポータルセッションの作成に失敗しました',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResubscribe = () => {
    window.location.href = '/subscribe';
  };

  if (subscriptionState === 'active') {
    return null;
  }

  return (
    <div className="w-full bg-amber-50 border-b border-amber-200 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <AlertCircle className="h-5 w-5 text-amber-600" />
          <div>
            <p className="text-sm font-medium text-amber-800">
              現在は未購読です。設定から再購読できます。
            </p>
            <p className="text-xs text-amber-600">
              プレミアム機能を利用するにはサブスクリプションが必要です
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {subscriptionState === 'inactive' && (
            <Button
              onClick={handleResubscribe}
              variant="outline"
              size="sm"
              className="border-amber-300 text-amber-700 hover:bg-amber-100"
            >
              <Crown className="h-4 w-4 mr-1" />
              サブスクを再開
            </Button>
          )}
          
          <Button
            onClick={handleManageSubscription}
            disabled={isLoading}
            size="sm"
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            <Settings className="h-4 w-4 mr-1" />
            {isLoading ? '読み込み中...' : '設定へ'}
          </Button>
        </div>
      </div>
    </div>
  );
}
