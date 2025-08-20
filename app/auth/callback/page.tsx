"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Profile } from "@/utils/core/types";

export default function AuthCallback() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check URL parameters for auth data
        const urlParams = new URLSearchParams(window.location.search);
        
        // Check for error in URL
        const error = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');
        const errorCode = urlParams.get('error_code');
        
        if (error) {
          // Handle specific database errors
          if (errorCode === 'unexpected_failure' && errorDescription?.includes('Database error saving new user')) {
            setError("データベースエラーが発生しました。管理者にお問い合わせください。");
          } else {
            setError(`OAuth error: ${error}`);
          }
          
          setIsLoading(false);
          return;
        }

        // Wait a bit for Supabase to process the auth
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Try to get the session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Auth callback error:", sessionError);
          setError("認証に失敗しました");
          setIsLoading(false);
          return;
        }

        if (session?.user) {
          // Check if user has a profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single() as { data: Profile | null };

          if (!profile) {
            // Create profile for new Google user
            const { error: profileError } = await supabase.from("profiles").insert([
              {
                id: session.user.id,
                timezone: "Asia/Tokyo",
                preferred_currency: "JPY",
                // Extract name from user metadata if available
                first_name: session.user.user_metadata?.full_name?.split(' ')[0] || 
                           session.user.user_metadata?.first_name || 
                           session.user.user_metadata?.name?.split(' ')[0] || 
                           "",
                last_name: session.user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || 
                          session.user.user_metadata?.last_name || 
                          session.user.user_metadata?.name?.split(' ').slice(1).join(' ') || 
                          "",
              },
            ]);

            if (profileError) {
              console.error("Profile creation error:", profileError);
              // Don't fail the auth flow if profile creation fails
            }
          }

          // Redirect to dashboard
          router.push("/dashboard/overview");
        } else {
          // Try to listen for auth state change
          const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
              router.push("/dashboard/overview");
            }
          });

          // Wait a bit more for auth state change
          setTimeout(() => {
            setError("認証セッションが見つかりません");
            setIsLoading(false);
            subscription.unsubscribe();
          }, 5000);
        }
      } catch (error) {
        console.error("Unexpected error during auth callback:", error);
        setError("予期しないエラーが発生しました");
        setIsLoading(false);
      }
    };

    handleAuthCallback();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>認証中...</CardTitle>
            <CardDescription>Googleアカウントでログインしています</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center pb-6">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>認証エラー</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={() => router.push("/auth/login")} 
              className="w-full"
            >
              ログインページに戻る
            </Button>
            <Button 
              onClick={() => router.push("/auth/signup")} 
              variant="outline" 
              className="w-full"
            >
              サインアップページに戻る
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
