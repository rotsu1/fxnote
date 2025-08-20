import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, Check, AlertCircle } from "lucide-react";

export function EmailManagement() {
    const [email, setEmail] = useState("")
    const [isVerified, setIsVerified] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [isSending, setIsSending] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
  
    // Fetch user data from Supabase on component mount
    useEffect(() => {
      const fetchUserData = async () => {
        try {
          const { data: { user }, error } = await supabase.auth.getUser()
          if (user && !error) {
            setEmail(user.email || "")
            setIsVerified(user.email_confirmed_at !== null)
          }
        } catch (error) {
          console.error("Error fetching user data:", error)
        } finally {
          setIsLoading(false)
        }
      }
  
      fetchUserData()
    }, [])
  
    const handleSaveEmail = async () => {
      try {
        const { error } = await supabase.auth.updateUser({ email: email })
        if (error) {
          throw error
        }
        setIsEditing(false)
        setIsVerified(false) // New email needs verification
        // You can add a toast notification here for success
      } catch (error) {
        console.error("Error updating email:", error)
        // You can add a toast notification here for error
      }
    }
  
    const handleResendVerification = async () => {
      setIsSending(true)
      try {
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email: email,
        })
        if (error) {
          throw error
        }
        // You can add a toast notification here for success
      } catch (error) {
        console.error("Error resending verification:", error)
        // You can add a toast notification here for error
      } finally {
        setIsSending(false)
      }
    }
  
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-600" />
            メールアドレス管理
          </CardTitle>
          <CardDescription>アカウントのメールアドレスを管理します</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="email">メールアドレス</Label>
                <div className="flex gap-2">
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={!isEditing}
                    className="flex-1"
                  />
              <Button
                variant={isEditing ? "default" : "outline"}
                onClick={isEditing ? handleSaveEmail : () => setIsEditing(true)}
              >
                {isEditing ? "保存" : "編集"}
              </Button>
              {isEditing && (
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  キャンセル
                </Button>
              )}
            </div>
          </div>
  
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              {isVerified ? (
                <>
                  <Check className="h-4 w-4 text-green-600" />
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    認証済み
                  </Badge>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <Badge variant="outline" className="border-orange-500 text-orange-700">
                    未認証
                  </Badge>
                </>
              )}
            </div>
            {!isVerified && (
              <Button variant="outline" size="sm" onClick={handleResendVerification} disabled={isSending}>
                {isSending ? "送信中..." : "認証メール再送信"}
              </Button>
            )}
          </div>
  
          {!isVerified && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>メールアドレスの認証が完了していません。認証メールを確認してください。</AlertDescription>
            </Alert>
          )}
            </>
          )}
        </CardContent>
      </Card>
    )
  }