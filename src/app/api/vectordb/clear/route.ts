import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(request: NextRequest) {
  try {
    console.log("VectorDB Clear: Starting vectordb cleanup...");
    
    // Get admin password from headers
    const adminPassword = request.headers.get('admin-password');
    const expectedPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';
    
    if (!adminPassword || adminPassword !== expectedPassword) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" }, 
        { status: 401 }
      );
    }

    // Call the Cooler API server to clear the VectorDB (since it's managed there)
    const coolerApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8888';
    const adminToken = 'Bearit01!';
    
    console.log("VectorDB Clear: Calling Cooler API to clear VectorDB...");
    console.log(`VectorDB Clear: Using Cooler API URL: ${coolerApiUrl}`);
    
    try {
      const response = await fetch(`${coolerApiUrl}/admin/vector-db/clear-all`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000),
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log("VectorDB Clear: VectorDB cleared successfully");
        
        return NextResponse.json({
          success: true,
          message: "VectorDB cleared successfully",
          timestamp: new Date().toISOString(),
          apiResponse: result
        });
      } else {
        const errorText = await response.text();
        console.error("VectorDB Clear: API call failed:", response.status, errorText);
        
        return NextResponse.json(
          { 
            success: false, 
            error: `API call failed: ${response.status}`,
            details: errorText
          }, 
          { status: response.status }
        );
      }
    } catch (fetchError) {
      console.error("VectorDB Clear: Fetch error:", fetchError);
      
      return NextResponse.json(
        { 
          success: false, 
          error: "Failed to call Cooler API",
          details: fetchError instanceof Error ? fetchError.message : 'Unknown error'
        }, 
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("VectorDB Clear: Error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to clear VectorDB",
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}
