"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Check } from "lucide-react"

export default function SubscriptionPage() {
  const handleManageSubscription = () => {
    // Placeholder handler for Stripe Customer Portal integration
    console.log("Manage subscription clicked - Stripe Customer Portal integration pending")
    alert("Manage subscription functionality coming soon!")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Subscription Plan
          </h1>
          <p className="text-gray-600">
            Choose the plan that works best for you
          </p>
        </div>

        {/* Subscription Card */}
        <Card className="shadow-lg border-0 bg-white">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Premium Plan
            </CardTitle>
            <div className="mt-4">
              <span className="text-4xl font-bold text-gray-900">¥490</span>
              <span className="text-gray-600 ml-2">/month</span>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <CardDescription className="text-center text-gray-600 mb-6">
              Get access to all premium features including advanced analytics, 
              unlimited trade tracking, and priority support.
            </CardDescription>

            {/* Features List */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span className="text-gray-700">Advanced trade analytics</span>
              </div>
              <div className="flex items-center space-x-3">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span className="text-gray-700">Unlimited trade entries</span>
              </div>
              <div className="flex items-center space-x-3">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span className="text-gray-700">Priority customer support</span>
              </div>
              <div className="flex items-center space-x-3">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span className="text-gray-700">Export functionality</span>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-center pt-6">
            <Button 
              onClick={handleManageSubscription}
              size="lg"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              Manage Subscription
            </Button>
          </CardFooter>
        </Card>

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Need help? Contact our support team
          </p>
        </div>
      </div>
    </div>
  )
}
