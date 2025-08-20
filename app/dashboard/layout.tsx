import AuthGuard from "@/components/AuthGuard";
import { getSubscriptionContext } from "@/lib/subscriptionHelpers";
import { SubscriptionBanner } from "./SubscriptionBanner";

export default async function Layout({ children }: { children: React.ReactNode }) {
    const subscriptionContext = await getSubscriptionContext();
    
    return (
        <AuthGuard>
            <div className="flex h-screen flex-col md:flex-row md:overflow-hidden">
                {subscriptionContext?.featuresLocked && (
                    <SubscriptionBanner 
                        subscriptionState={subscriptionContext.subscriptionState}
                        userId={subscriptionContext.user.id}
                    />
                )}
                <div className="flex-grow md:overflow-y-auto">{children}</div>
            </div>
        </AuthGuard>
    )
}