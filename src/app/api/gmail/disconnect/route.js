// app/api/gmail/disconnect/route.js
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { deleteUserGoogleToken } from '@/lib/tokenUtils'

export async function POST() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Delete the user's Google token
    const success = await deleteUserGoogleToken(user.id);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to disconnect Gmail' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Gmail disconnected successfully'
    });
    
  } catch (error) {
    console.error('Error disconnecting Gmail:', error);
    return NextResponse.json(
      { 
        error: 'Failed to disconnect Gmail',
        details: error.message 
      },
      { status: 500 }
    )
  }
}