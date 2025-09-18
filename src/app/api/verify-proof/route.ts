import { NextRequest, NextResponse } from 'next/server';
import { verifySiweMessage } from '@worldcoin/minikit-js';

export async function POST(request: NextRequest) {
  try {
    const { payload, action } = await request.json();

    console.log('API verify-proof called with:', { action, payload: payload ? 'present' : 'missing' });

    if (!payload || !action) {
      console.log('Missing payload or action');
      return NextResponse.json(
        { error: 'Missing payload or action' },
        { status: 400 }
      );
    }

    // For demo purposes, we'll accept any valid payload
    // In production, you should verify the action matches your registered actions
    const validActions = ['lemon-planet-auth', 'test-action'];
    
    if (!validActions.includes(action)) {
      console.log('Invalid action:', action);
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    console.log('Attempting to verify SIWE message...');
    // Verify the SIWE message - use the nonce from the payload itself
    const result = await verifySiweMessage(payload, payload.nonce || 'lemon-planet-nonce');

    console.log('SIWE verification result:', { isValid: result.isValid, address: result.siweMessageData?.address });

    if (!result.isValid) {
      console.log('Invalid proof');
      return NextResponse.json(
        { error: 'Invalid proof' },
        { status: 400 }
      );
    }

    console.log('Verification successful!');
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
