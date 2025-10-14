import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
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

    const { userId } = params;
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    // Fetch user's recent transactions from the production API
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'https://api.cooler.dev'}/admin/customers/${userId}/database-counts`;
    
    console.log(`Fetching transactions for user ${userId} from ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer Bearit01!',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch transactions: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { 
          success: false, 
          error: `Failed to fetch transactions: ${response.status}`,
          details: await response.text()
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Extract and format recent transactions
    const recentTransactions = (data.recentTransactions || []).slice(0, 7).map((tx: any) => ({
      id: tx.id,
      dateCreated: tx.dateCreated,
      status: tx.statusFootprint,
      itemCount: tx.itemCount || 0,
      stripeUsageId: tx.stripeUsageId,
    }));

    return NextResponse.json({
      success: true,
      userId,
      transactions: recentTransactions,
      totalCount: data.counts?.transactions || 0,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch transactions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
