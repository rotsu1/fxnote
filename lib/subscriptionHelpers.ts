import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getUserSubscriptionState } from './subscription';

export type SubscriptionAccessLevel = 'active' | 'allow-inactive' | 'allow-any';

export interface SubscriptionContext {
  user: any;
  subscriptionState: 'never_subscribed' | 'active' | 'inactive';
  featuresLocked: boolean;
}

/**
 * Helper function to check subscription state and enforce access control
 */
export async function requireSubscriptionState(
  expected: SubscriptionAccessLevel
): Promise<SubscriptionContext> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );

  // Get current user
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    redirect('/login');
  }

  // Get subscription state
  const subscriptionState = await getUserSubscriptionState(user.id);

  // Enforce access control based on expected level
  switch (expected) {
    case 'active':
      if (subscriptionState !== 'active') {
        redirect('/subscribe');
      }
      break;
    
    case 'allow-inactive':
      // Allow both active and inactive, but redirect never_subscribed
      if (subscriptionState === 'never_subscribed') {
        redirect('/subscribe');
      }
      break;
    
    case 'allow-any':
      // Allow all states
      break;
  }

  return {
    user,
    subscriptionState,
    featuresLocked: subscriptionState !== 'active',
  };
}

/**
 * Helper function to get subscription context without redirects
 */
export async function getSubscriptionContext(): Promise<SubscriptionContext | null> {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );

    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return null;
    }

    const subscriptionState = await getUserSubscriptionState(user.id);

    return {
      user,
      subscriptionState,
      featuresLocked: subscriptionState !== 'active',
    };
  } catch (error) {
    console.error('Error getting subscription context:', error);
    return null;
  }
}
