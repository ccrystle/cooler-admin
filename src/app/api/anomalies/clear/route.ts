import { NextRequest, NextResponse } from 'next/server';
import { clearTable } from '../../../../lib/db';

export async function DELETE(request: NextRequest) {
  try {
    console.log("Anomalies Clear: Starting anomalies cleanup...");
    
    // Get admin password from headers
    const adminPassword = request.headers.get('admin-password');
    const expectedPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';
    
    if (!adminPassword || adminPassword !== expectedPassword) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" }, 
        { status: 401 }
      );
    }

    // Clear the anomaly_flags table directly from the database
    const result = await clearTable('anomaly_flags');
    
    if (result.success) {
      console.log("Anomalies Clear: Anomaly flags cleared successfully");
      
      return NextResponse.json({
        success: true,
        message: `Anomaly flags cleared successfully. Removed ${result.rowCount} rows.`,
        timestamp: new Date().toISOString(),
        rowCount: result.rowCount
      });
    } else {
      console.error("Anomalies Clear: Failed to clear anomaly flags:", result.error);
      
      return NextResponse.json(
        { 
          success: false, 
          error: "Failed to clear anomaly flags",
          details: result.error
        }, 
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("Anomalies Clear: Error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to clear anomalies",
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}
