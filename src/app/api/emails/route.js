// app/api/emails/route.js
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in again.' },
        { status: 401 }
      )
    }
    
    // Get the user's Google access token
    const { data: tokenData, error: tokenError } = await supabase
      .from('user_google_tokens')
      .select('access_token, expires_at')
      .eq('user_id', user.id)
      .maybeSingle()
    
    if (tokenError) {
      console.error('Database error:', tokenError)
      return NextResponse.json(
        { error: 'Database error occurred' },
        { status: 500 }
      )
    }
    
    if (!tokenData) {
      return NextResponse.json(
        { error: 'Gmail not connected. Please connect your Gmail account first.' },
        { status: 403 }
      )
    }

    // Check if token is expired
    if (tokenData.expires_at && new Date(tokenData.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Gmail access expired. Please reconnect your account.' },
        { status: 401 }
      )
    }
    
    // Fetch emails from Gmail API
    const gmailResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=15', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (gmailResponse.status === 401) {
      return NextResponse.json(
        { error: 'Google authentication failed. Please reconnect your Gmail.' },
        { status: 401 }
      )
    }
    
    if (!gmailResponse.ok) {
      const errorText = await gmailResponse.text()
      console.error('Gmail API error:', gmailResponse.status, errorText)
      return NextResponse.json(
        { error: 'Failed to fetch emails from Gmail' },
        { status: gmailResponse.status }
      )
    }
    
    const gmailData = await gmailResponse.json()
    const messages = gmailData.messages || []
    
    // Get basic email details without fetching each message
    const emailList = messages.map(message => ({
      id: message.id,
      threadId: message.threadId,
      // We'll get more details in the frontend if needed
    }))
    
    return NextResponse.json({ 
      success: true,
      emails: emailList,
      totalCount: messages.length
    })
    
  } catch (error) {
    console.error('Unexpected error in emails API:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}