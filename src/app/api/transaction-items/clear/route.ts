import { NextRequest, NextResponse } from 'next/server';
import { clearTable } from '../../../../lib/db';

export async function DELETE(request: NextRequest) {
  try {
    console.log("Transaction Items Clear: Starting transaction items cleanup...");
    
    // Get admin password from headers
    const adminPassword = request.headers.get('admin-password');
    const expectedPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';
    
    if (!adminPassword || adminPassword !== expectedPassword) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" }, 
        { status: 401 }
      );
    }

    // Clear the transaction_items table directly from the database
    const result = await clearTable('transaction_items');
    
    if (result.success) {
      console.log("Transaction Items Clear: Transaction items cleared successfully");
      
      return NextResponse.json({
        success: true,
        message: `Transaction items cleared successfully. Removed ${result.rowCount} rows.`,
        timestamp: new Date().toISOString(),
        rowCount: result.rowCount
      });
    } else {
      console.error("Transaction Items Clear: Failed to clear transaction items:", result.error);
      
      return NextResponse.json(
        { 
          success: false, 
          error: "Failed to clear transaction items",
          details: result.error
        }, 
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("Transaction Items Clear: Error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to clear transaction items",
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}
