import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Crown, Receipt } from "lucide-react";

// Sample billing data
const sampleBillingData = {
    currentPlan: {
      name: "FXNote Pro",
      price: "¥490",
      period: "月額",
      features: ["無制限の取引記録", "高度な分析ツール", "カスタムタグ", "データエクスポート"]
    },
    subscription: {
      status: "active", // "active", "trial", "cancelled", "expired"
      nextPaymentDate: "2024-02-15",
      trialEndDate: "2024-01-31",
      expireDate: "2024-02-15",
      isTrial: false,
      isCancelled: false
    },
    billingHistory: [
      { id: 1, date: "2024-01-15", amount: "¥490", status: "完了", description: "FXNote Pro - 1月分" },
      { id: 2, date: "2023-12-15", amount: "¥490", status: "完了", description: "FXNote Pro - 12月分" },
      { id: 3, date: "2023-11-15", amount: "¥490", status: "完了", description: "FXNote Pro - 12月分" },
    ],
    paymentMethod: {
      type: "クレジットカード",
      last4: "****1234",
      expiry: "12/25",
      brand: "Visa"
    }
  }
  
  // Sample data variations for different subscription statuses
  const subscriptionVariations = {
    active: {
      status: "active",
      nextPaymentDate: "2024-02-15",
      trialEndDate: "2024-01-31",
      expireDate: "2024-02-15",
      isTrial: false,
      isCancelled: false
    },
    trial: {
      status: "trial",
      nextPaymentDate: "2024-02-15",
      trialEndDate: "2024-01-31",
      expireDate: "2024-01-31",
      isTrial: true,
      isCancelled: false
    },
    cancelled: {
      status: "cancelled",
      nextPaymentDate: "2024-02-15",
      trialEndDate: "2024-01-31",
      expireDate: "2024-02-15",
      isTrial: false,
      isCancelled: true
    },
    expired: {
      status: "expired",
      nextPaymentDate: "2024-01-15",
      trialEndDate: "2024-01-31",
      expireDate: "2024-01-15",
      isTrial: false,
      isCancelled: false
    }
  }

export function CurrentPlan() {
    const [currentSubscription, setCurrentSubscription] = useState(sampleBillingData.subscription);
    const { currentPlan } = sampleBillingData
  
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  
    const getStatusBadge = () => {
      if (currentSubscription.isCancelled) {
        return (
          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
            キャンセル済み
          </Badge>
        );
      }
      if (currentSubscription.isTrial) {
        return (
          <Badge variant="default" className="bg-purple-100 text-purple-800">
            トライアル中
          </Badge>
        );
      }
      if (currentSubscription.status === "expired") {
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800">
            期限切れ
          </Badge>
        );
      }
      return (
        <Badge variant="default" className="bg-blue-100 text-blue-800">
          アクティブ
        </Badge>
      );
    }
  
    const getDateInfo = () => {
      if (currentSubscription.isCancelled) {
        return {
          label: "サービス終了日",
          date: currentSubscription.expireDate,
          description: "キャンセル後もこの日までサービスをご利用いただけます"
        };
      }
      if (currentSubscription.isTrial) {
        return {
          label: "トライアル終了日",
          date: currentSubscription.trialEndDate,
          description: "この日まで無料でお試しいただけます"
        };
      }
      if (currentSubscription.status === "expired") {
        return {
          label: "有効期限",
          date: currentSubscription.expireDate,
          description: "サービスが終了しました"
        };
      }
      return {
        label: "次回支払い日",
        date: currentSubscription.nextPaymentDate,
        description: "次回の自動更新日です"
      };
    }
  
    const dateInfo = getDateInfo();
  
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-600" />
            現在のプラン
          </CardTitle>
          <CardDescription>あなたのサブスクリプションプラン</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <Crown className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{currentPlan.name}</h3>
                <p className="text-2xl font-bold text-blue-600">
                  {currentPlan.price}<span className="text-sm font-normal text-muted-foreground">/{currentPlan.period}</span>
                </p>
              </div>
            </div>
            {getStatusBadge()}
          </div>
  
          <div className="space-y-2">
            <h4 className="font-medium">含まれる機能</h4>
            <ul className="space-y-1">
              {currentPlan.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
  
          <div className="p-4 bg-gray-50 rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <Receipt className="h-4 w-4 text-gray-600" />
              <span className="font-medium text-sm">{dateInfo.label}</span>
            </div>
            <p className="text-lg font-semibold text-gray-900">
              {formatDate(dateInfo.date)}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {dateInfo.description}
            </p>
          </div>
  
          {/* Demo section for testing different subscription statuses */}
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <h4 className="font-medium text-sm text-yellow-800 mb-3">デモ: サブスクリプション状態の切り替え</h4>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setCurrentSubscription(subscriptionVariations.active)}
                className="text-xs"
              >
                アクティブ
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setCurrentSubscription(subscriptionVariations.trial)}
                className="text-xs"
              >
                トライアル
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setCurrentSubscription(subscriptionVariations.cancelled)}
                className="text-xs"
              >
                キャンセル済み
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setCurrentSubscription(subscriptionVariations.expired)}
                className="text-xs"
              >
                期限切れ
              </Button>
            </div>
          </div>
  
          <Button variant="outline" className="w-full">
            プランを変更
          </Button>
        </CardContent>
      </Card>
    )
  }