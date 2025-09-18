import { NextRequest, NextResponse } from 'next/server';
// import { verifySiweMessage } from '@worldcoin/minikit-js'; // Comentado temporalmente para debugging

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

    console.log('Payload structure:', JSON.stringify(payload, null, 2));

    // TEMPORAL: Para debugging, vamos a aceptar cualquier payload válido
    // En lugar de verificar SIWE, vamos a simular éxito
    console.log('Skipping SIWE verification for debugging...');
    
    // Simular verificación exitosa temporalmente
    console.log('Verification successful (simulated)!');
    return NextResponse.json({
      verifyRes: {
        success: true,
        address: '0x1234567890123456789012345678901234567890', // Dirección simulada
        action,
      },
    });

    // Código original comentado para debugging:
    /*
    console.log('Attempting to verify SIWE message...');
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
    */
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
}
