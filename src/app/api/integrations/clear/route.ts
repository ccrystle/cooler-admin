import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../../lib/db';

export async function DELETE(request: NextRequest) {
  try {
    console.log("Integrations Clear: Starting integrations cleanup...");
    
    // Get admin password from headers
    const adminPassword = request.headers.get('admin-password');
    const expectedPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';
    
    if (!adminPassword || adminPassword !== expectedPassword) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" }, 
        { status: 401 }
      );
    }

    // Clear Shopify integrations from the database
    console.log("Integrations Clear: Clearing Shopify integrations...");
    
    try {
      const result = await query('DELETE FROM integrations WHERE type = $1', ['shopify']);
      
      console.log(`Integrations Clear: Successfully cleared ${result.rowCount} Shopify integrations`);
      
      return NextResponse.json({
        success: true,
        message: `Shopify integrations cleared successfully. Removed ${result.rowCount} rows.`,
        timestamp: new Date().toISOString(),
        rowCount: result.rowCount
      });
    } catch (dbError) {
      const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown database error';
      console.error("Integrations Clear: Database error:", errorMessage);
      
      return NextResponse.json(
        { 
          success: false, 
          error: "Failed to clear Shopify integrations",
          details: errorMessage
        }, 
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("Integrations Clear: Error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to clear integrations",
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}


