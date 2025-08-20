import { getSubscriptionContext } from "@/lib/subscriptionHelpers";
import { SettingsContent } from "./SettingsContent";

export default async function SettingsPage() {
  const subscriptionContext = await getSubscriptionContext();
  
  if (!subscriptionContext) {
    return null; // This should not happen due to AuthGuard
  }

  return (
    <SettingsContent 
      featuresLocked={subscriptionContext.featuresLocked}
      subscriptionState={subscriptionContext.subscriptionState}
      userId={subscriptionContext.user.id}
    />
  );
}
