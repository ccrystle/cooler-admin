import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization');
    const expectedToken = 'Bearer Bearit01!';
    
    if (!authHeader || authHeader !== expectedToken) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get userId from request body
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    // Generate nonce for one-time use
    const nonce = crypto.randomUUID();
    
    // Calculate expiry (5 minutes from now)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Create JWT payload
    const payload = {
      userId,
      adminId: 'admin', // In production, this would be the actual admin user ID
      readOnly: true,
      expiresAt: expiresAt.toISOString(),
      nonce,
      iat: Math.floor(Date.now() / 1000),
    };

    // Sign JWT using admin secret
    const secret = new TextEncoder().encode(
      process.env.ADMIN_JWT_SECRET || 'admin-secret-key-change-in-production'
    );
    
    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('5m')
      .sign(secret);

    // Generate magic link using environment variable
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.cooler.dev';
    // For local development, redirect to transactions page with user context
    // In production, this would be /auth/impersonate?token={token}
    const magicLink = `${appUrl}/transactions?impersonate=${userId}&token=${token}`;

    // Log impersonation attempt for audit
    console.log('[AUDIT] Impersonation request:', {
      adminId: 'admin',
      targetUserId: userId,
      timestamp: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
      nonce,
    });

    return NextResponse.json({
      success: true,
      magicLink,
      token,
      expiresAt: expiresAt.toISOString(),
      message: 'Magic link generated successfully',
    });

  } catch (error) {
    console.error('Error generating magic link:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate magic link',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
