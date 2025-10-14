import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '100';
    const userId = searchParams.get('userId');
    
    // Build the API URL
    let apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'https://api.cooler.dev'}/admin/api-requests/recent?limit=${limit}`;
    
    // Add user filter if specified
    if (userId) {
      apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'https://api.cooler.dev'}/admin/customers/${userId}/api-requests/recent?limit=${limit}`;
    }
    
    console.log(`API Requests: Fetching from ${apiUrl}`);
    
    // Make request to production API
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer Bearit01!',
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.error(`API Requests: Failed to fetch - ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { 
          success: false, 
          error: `Failed to fetch API requests: ${response.status}`,
          details: await response.text()
        }, 
        { status: response.status }
      );
    }
    
    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      data: data,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('API Requests: Error fetching requests:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch API requests',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}
