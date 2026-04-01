// Lovable auth integration — simplified fallback when cloud-auth-js is unavailable
import { supabase } from "../supabase/client";

type SignInOptions = {
  redirect_uri?: string;
  extraParams?: Record<string, string>;
};

export const lovable = {
  auth: {
    signInWithOAuth: async (provider: "google" | "apple" | "microsoft", opts?: SignInOptions) => {
      const providerMap: Record<string, string> = { google: 'google', apple: 'apple', microsoft: 'azure' };
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: (providerMap[provider] || provider) as any,
        options: {
          redirectTo: opts?.redirect_uri || window.location.origin,
        },
      });

      if (error) {
        return { error, redirected: false };
      }

      return { error: null, redirected: true };
    },
  },
};
