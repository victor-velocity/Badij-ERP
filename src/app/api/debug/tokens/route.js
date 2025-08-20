// app/api/debug/tokens/route.js
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get current user
    const { data: { user }, error: getUserError } = await supabase.auth.getUser()
    
    if (getUserError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Check all tokens in the database
    const { data: allTokens, error: allError } = await supabase
      .from('user_google_tokens')
      .select('*');

    // Check tokens for current user
    const { data: userTokens, error: userTokensError } = await supabase
      .from('user_google_tokens')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email
      },
      allTokens: allTokens || [],
      userTokens: userTokens || null,
      errors: {
        allError: allError?.message,
        getUserError: getUserError?.message,
        userTokensError: userTokensError?.message
      }
    });

  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ error: 'Debug failed' }, { status: 500 });
  }
}