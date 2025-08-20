import { getSubscriptionContext } from "@/lib/subscriptionHelpers";
import { DashboardContent } from "./DashboardContent";

export default async function DashboardPage() {
  const subscriptionContext = await getSubscriptionContext();
  
  if (!subscriptionContext) {
    return null; // This should not happen due to AuthGuard
  }

  return (
    <DashboardContent 
      featuresLocked={subscriptionContext.featuresLocked}
      subscriptionState={subscriptionContext.subscriptionState}
      userId={subscriptionContext.user.id}
    />
  );
}
