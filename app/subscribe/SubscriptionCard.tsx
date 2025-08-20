"use client";

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionCardProps {
  subscriptionState: 'never_subscribed' | 'active' | 'inactive';
  userId: string;
  userEmail: string;
}

export function SubscriptionCard({ subscriptionState, userId, userEmail }: SubscriptionCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleStartSubscription = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          email: userEmail,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast({
        title: 'エラー',
        description: error instanceof Error ? error.message : 'チェックアウトセッションの作成に失敗しました',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

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

  if (subscriptionState === 'active') {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
              ✓ アクティブ
            </Badge>
          </div>
          <CardTitle className="text-2xl">サブスクリプション有効</CardTitle>
          <CardDescription>
            現在、プレミアム機能をご利用いただけます
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-gray-600 mb-4">
            サブスクリプションの管理や請求情報の確認は
            下のボタンから行えます
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button 
            onClick={handleManageSubscription}
            disabled={isLoading}
            className="w-full"
            variant="outline"
          >
            {isLoading ? '読み込み中...' : '管理する（ポータルへ）'}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-2">
          <Badge variant="default" className="bg-blue-100 text-blue-800 border-blue-200">
            初回1か月無料
          </Badge>
        </div>
        <CardTitle className="text-3xl font-bold">¥490</CardTitle>
        <CardDescription className="text-lg">月額</CardDescription>
        <p className="text-xs text-gray-500 mt-2">
          * 新規ユーザーのみ初回1か月間無料
        </p>
      </CardHeader>
      
      <CardContent>
        <ul className="space-y-3 text-sm">
          <li className="flex items-center">
            <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            詳細なパフォーマンス分析
          </li>
          <li className="flex items-center">
            <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            カレンダー表示機能
          </li>
          <li className="flex items-center">
            <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            高度なテーブル機能
          </li>
          <li className="flex items-center">
            <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            優先サポート
          </li>
        </ul>
      </CardContent>
      
      <CardFooter>
        <Button 
          onClick={handleStartSubscription}
          disabled={isLoading}
          className="w-full"
          size="lg"
        >
          {isLoading ? '読み込み中...' : '無料で始める'}
        </Button>
      </CardFooter>
    </Card>
  );
}
