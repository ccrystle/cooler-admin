import { NextRequest, NextResponse } from 'next/server';
import { clearTable } from '../../../../lib/db';

export async function DELETE(request: NextRequest) {
  try {
    console.log("Submissions Clear: Starting submissions cleanup...");
    
    // Get admin password from headers
    const adminPassword = request.headers.get('admin-password');
    const expectedPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';
    
    if (!adminPassword || adminPassword !== expectedPassword) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" }, 
        { status: 401 }
      );
    }

    // Clear the submissions table directly from the database
    const result = await clearTable('submissions');
    
    if (result.success) {
      console.log("Submissions Clear: Submissions cleared successfully");
      
      return NextResponse.json({
        success: true,
        message: `Submissions cleared successfully. Removed ${result.rowCount} rows.`,
        timestamp: new Date().toISOString(),
        rowCount: result.rowCount
      });
    } else {
      console.error("Submissions Clear: Failed to clear submissions:", result.error);
      
      return NextResponse.json(
        { 
          success: false, 
          error: "Failed to clear submissions",
          details: result.error
        }, 
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("Submissions Clear: Error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to clear submissions",
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}



