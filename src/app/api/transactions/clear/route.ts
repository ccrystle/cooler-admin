import { NextRequest, NextResponse } from 'next/server';
import { clearTable } from '../../../../lib/db';

export async function DELETE(request: NextRequest) {
  try {
    console.log("Transactions Clear: Starting transactions cleanup...");
    
    // Get admin password from headers
    const adminPassword = request.headers.get('admin-password');
    const expectedPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';
    
    if (!adminPassword || adminPassword !== expectedPassword) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" }, 
        { status: 401 }
      );
    }

    // Clear the transactions table directly from the database
    const result = await clearTable('transactions');
    
    if (result.success) {
      console.log("Transactions Clear: Transactions cleared successfully");
      
      return NextResponse.json({
        success: true,
        message: `Transactions cleared successfully. Removed ${result.rowCount} rows.`,
        timestamp: new Date().toISOString(),
        rowCount: result.rowCount
      });
    } else {
      console.error("Transactions Clear: Failed to clear transactions:", result.error);
      
      return NextResponse.json(
        { 
          success: false, 
          error: "Failed to clear transactions",
          details: result.error
        }, 
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("Transactions Clear: Error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to clear transactions",
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}
