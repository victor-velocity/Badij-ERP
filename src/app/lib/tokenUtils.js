// lib/tokenUtils.js
import { createClient } from '@/app/lib/supabase/server';

export async function getUserGoogleToken(userId) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('user_google_tokens')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', 'google')
    .maybeSingle(); // Use maybeSingle instead of single to avoid errors

  if (error) {
    console.error('Error fetching user token:', error);
    return null;
  }

  return data;
}

export async function upsertUserGoogleToken(userId, tokenData) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('user_google_tokens')
    .upsert({
      user_id: userId,
      provider: 'google',
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString(),
      token_type: tokenData.token_type,
      scope: tokenData.scope,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id, provider'
    })
    .select()
    .single();

  if (error) {
    console.error('Error upserting user token:', error);
    return null;
  }

  return data;
}

export async function deleteUserGoogleToken(userId) {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('user_google_tokens')
    .delete()
    .eq('user_id', userId)
    .eq('provider', 'google');

  if (error) {
    console.error('Error deleting user token:', error);
    return false;
  }

  return true;
}