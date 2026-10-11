import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
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
              // Ignore if already set in response
            }
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.user) {
      let finalUsername = data.user.user_metadata?.user_name || 
        data.user.user_metadata?.preferred_username;

      // Enrich profile with Twitter API v2 using provider_token if available
      const providerToken = data.session?.provider_token;
      if (providerToken) {
        try {
          const twitterRes = await fetch(
            'https://api.twitter.com/2/users/me?user.fields=description,location,profile_image_url',
            {
              headers: {
                Authorization: `Bearer ${providerToken}`,
              },
            }
          );

          if (twitterRes.ok) {
            const twitterData = await twitterRes.json();
            const twitterUser = twitterData?.data;

            if (twitterUser) {
              finalUsername = twitterUser.username || finalUsername;

              const updates: any = {};
              if (twitterUser.description) updates.bio = twitterUser.description;
              if (twitterUser.location) updates.location = twitterUser.location;
              if (twitterUser.name) updates.name = twitterUser.name;
              if (twitterUser.username) updates.username = twitterUser.username.toLowerCase();
              if (twitterUser.profile_image_url) {
                updates.avatar_url = twitterUser.profile_image_url.replace('_normal.', '_400x400.');
              }

              // Update the profiles table with real bio & location!
              await supabase
                .from('profiles')
                .update(updates)
                .eq('id', data.user.id);
            }
          }
        } catch (fetchErr) {
          console.error('Error fetching Twitter user fields:', fetchErr);
        }
      }

      // Find username for redirect
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', data.user.id)
        .single();

      const username = profile?.username || finalUsername;

      if (username) {
        return NextResponse.redirect(`${origin}/${username.toLowerCase()}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
