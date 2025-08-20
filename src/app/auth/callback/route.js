// app/auth/callback/route.js
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const state = requestUrl.searchParams.get('state')

  let returnTo = '/notifications'
  try {
    if (state) {
      const stateData = JSON.parse(decodeURIComponent(state))
      returnTo = stateData.returnTo || returnTo
    }
  } catch (e) {
    console.error('Error parsing state:', e)
  }

  if (error) {
    console.error('OAuth error:', error)
    return NextResponse.redirect(`${requestUrl.origin}${returnTo}?error=auth_failed`)
  }

  if (!code) {
    return NextResponse.redirect(`${requestUrl.origin}${returnTo}?error=no_code`)
  }

  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    console.log('🔍 Starting OAuth callback with code:', code.substring(0, 20) + '...');
    
    // Exchange the code for a session
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      console.error('❌ Error exchanging code:', exchangeError)
      return NextResponse.redirect(`${requestUrl.origin}${returnTo}?error=exchange_failed`)
    }
    
    console.log('✅ Session exchange successful');
    console.log('📋 Session data:', {
      hasUser: !!data.user,
      userId: data.user?.id,
      hasProviderToken: !!data.session?.provider_token,
      hasAccessToken: !!data.session?.access_token,
      hasRefreshToken: !!data.session?.refresh_token
    });

    if (!data.user) {
      console.error('❌ No user data in session');
      return NextResponse.redirect(`${requestUrl.origin}${returnTo}?error=no_user`)
    }

    // Try to get tokens from the session first
    let accessToken = data.session?.provider_token || data.session?.access_token;
    let refreshToken = data.session?.refresh_token;
    
    console.log('🔑 Tokens from session:', {
      accessToken: accessToken ? accessToken.substring(0, 20) + '...' : 'None',
      refreshToken: refreshToken ? refreshToken.substring(0, 20) + '...' : 'None'
    });

    // If no tokens in session, try manual exchange
    if (!accessToken) {
      console.log('⚠️ No tokens in session, trying manual exchange...');
      try {
        const manualTokens = await exchangeCodeForGoogleTokensManual(code);
        if (manualTokens) {
          accessToken = manualTokens.access_token;
          refreshToken = manualTokens.refresh_token;
          console.log('✅ Manual token exchange successful');
        }
      } catch (manualError) {
        console.error('❌ Manual token exchange failed:', manualError);
      }
    }

    if (!accessToken) {
      console.error('❌ No access token available after all attempts');
      return NextResponse.redirect(`${requestUrl.origin}${returnTo}?error=no_tokens`)
    }

    // Store the tokens in database
    console.log('💾 Storing tokens in database for user:', data.user.id);
    
    const { error: upsertError } = await supabase
      .from('user_google_tokens')
      .upsert({
        user_id: data.user.id,
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: data.session?.expires_at 
          ? new Date(data.session.expires_at * 1000).toISOString()
          : new Date(Date.now() + 3600 * 1000).toISOString(), // 1 hour default
        token_type: 'Bearer',
        scope: 'https://www.googleapis.com/auth/gmail.modify',
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
        ignoreDuplicates: false
      })

    if (upsertError) {
      console.error('❌ Error storing tokens:', upsertError);
      return NextResponse.redirect(`${requestUrl.origin}${returnTo}?error=storage_failed`)
    }

    console.log('✅ Tokens stored successfully in database');
    return NextResponse.redirect(`${requestUrl.origin}${returnTo}?success=gmail_connected`)
    
  } catch (error) {
    console.error('❌ Unexpected error in auth callback:', error)
    return NextResponse.redirect(`${requestUrl.origin}${returnTo}?error=unexpected`)
  }
}

// Manual token exchange function
async function exchangeCodeForGoogleTokensManual(code) {
  try {
    const tokenUrl = 'https://oauth2.googleapis.com/token';
    
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code: code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${process.env.NEXTAUTH_URL}/auth/callback`,
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google token exchange failed: ${response.status} ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Manual token exchange error:', error);
    return null;
  }
}