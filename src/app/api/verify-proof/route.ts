import { NextRequest, NextResponse } from 'next/server';
import { verifySiweMessage } from '@worldcoin/minikit-js';

export async function POST(request: NextRequest) {
  try {
    const { payload, action } = await request.json();

    if (!payload || !action) {
      return NextResponse.json(
        { error: 'Missing payload or action' },
        { status: 400 }
      );
    }

    // For demo purposes, we'll accept any valid payload
    // In production, you should verify the action matches your registered actions
    const validActions = ['lemon-planet-auth', 'test-action'];
    
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    // Verify the SIWE message
    const result = await verifySiweMessage(payload, 'lemon-planet-nonce');

    if (!result.isValid) {
      return NextResponse.json(
        { error: 'Invalid proof' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      verifyRes: {
        success: true,
        address: result.siweMessageData.address,
        action,
      },
    });
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
}
