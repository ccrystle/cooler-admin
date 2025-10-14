import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log("Clear Database: Starting database cleanup from Cooler Admin backend...");
    
    // Get admin password from headers
    const adminPassword = request.headers.get('admin-password');
    const expectedPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';
    
    if (!adminPassword || adminPassword !== expectedPassword) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" }, 
        { status: 401 }
      );
    }

    // Call the local Next.js API routes for database operations
    const baseUrl = request.url.replace('/api/clear-database', '');
    
    console.log(`Clear Database: Using local API routes at: ${baseUrl}`);
    console.log(`Clear Database: Admin password verified`);

    const results = {
      vectordb: { success: false, error: null },
      transactions: { success: false, error: null },
      transactionItems: { success: false, error: null },
      submissions: { success: false, error: null },
      anomalies: { success: false, error: null },
      integrations: { success: false, error: null }
    };

    // Clear VectorDB
    try {
      console.log("Clear Database: Clearing vectordb...");
      const vectordbResponse = await fetch(`${baseUrl}/api/vectordb/clear`, {
        method: 'DELETE',
        headers: {
          'admin-password': adminPassword,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000),
      });
      
      if (vectordbResponse.ok) {
        results.vectordb.success = true;
        console.log("Clear Database: VectorDB cleared successfully");
      } else {
        const errorText = await vectordbResponse.text();
        results.vectordb.error = `${vectordbResponse.status}: ${errorText}`;
        console.error("Clear Database: VectorDB clear failed:", results.vectordb.error);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      results.vectordb.error = errorMsg;
      console.error("Clear Database: VectorDB clear failed:", errorMsg);
    }

    // Clear Transactions
    try {
      console.log("Clear Database: Clearing transactions...");
      const transactionsResponse = await fetch(`${baseUrl}/api/transactions/clear`, {
        method: 'DELETE',
        headers: {
          'admin-password': adminPassword,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000),
      });
      
      if (transactionsResponse.ok) {
        results.transactions.success = true;
        console.log("Clear Database: Transactions cleared successfully");
      } else {
        const errorText = await transactionsResponse.text();
        results.transactions.error = `${transactionsResponse.status}: ${errorText}`;
        console.error("Clear Database: Transactions clear failed:", results.transactions.error);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      results.transactions.error = errorMsg;
      console.error("Clear Database: Transactions clear failed:", errorMsg);
    }

    // Clear Transaction Items
    try {
      console.log("Clear Database: Clearing transaction items...");
      const transactionItemsResponse = await fetch(`${baseUrl}/api/transaction-items/clear`, {
        method: 'DELETE',
        headers: {
          'admin-password': adminPassword,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000),
      });
      
      if (transactionItemsResponse.ok) {
        results.transactionItems.success = true;
        console.log("Clear Database: Transaction items cleared successfully");
      } else {
        const errorText = await transactionItemsResponse.text();
        results.transactionItems.error = `${transactionItemsResponse.status}: ${errorText}`;
        console.error("Clear Database: Transaction items clear failed:", results.transactionItems.error);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      results.transactionItems.error = errorMsg;
      console.error("Clear Database: Transaction items clear failed:", errorMsg);
    }

    // Clear Submissions
    try {
      console.log("Clear Database: Clearing submissions...");
      const submissionsResponse = await fetch(`${baseUrl}/api/submissions/clear`, {
        method: 'DELETE',
        headers: {
          'admin-password': adminPassword,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000),
      });
      
      if (submissionsResponse.ok) {
        results.submissions.success = true;
        console.log("Clear Database: Submissions cleared successfully");
      } else {
        const errorText = await submissionsResponse.text();
        results.submissions.error = `${submissionsResponse.status}: ${errorText}`;
        console.error("Clear Database: Submissions clear failed:", results.submissions.error);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      results.submissions.error = errorMsg;
      console.error("Clear Database: Submissions clear failed:", errorMsg);
    }

    // Clear Anomalies
    try {
      console.log("Clear Database: Clearing anomalies...");
      const anomaliesResponse = await fetch(`${baseUrl}/api/anomalies/clear`, {
        method: 'DELETE',
        headers: {
          'admin-password': adminPassword,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000),
      });
      
      if (anomaliesResponse.ok) {
        results.anomalies.success = true;
        console.log("Clear Database: Anomalies cleared successfully");
      } else {
        const errorText = await anomaliesResponse.text();
        results.anomalies.error = `${anomaliesResponse.status}: ${errorText}`;
        console.error("Clear Database: Anomalies clear failed:", results.anomalies.error);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      results.anomalies.error = errorMsg;
      console.error("Clear Database: Anomalies clear failed:", errorMsg);
    }

    // Clear Integrations (Shopify)
    try {
      console.log("Clear Database: Clearing Shopify integrations...");
      const integrationsResponse = await fetch(`${baseUrl}/api/integrations/clear`, {
        method: 'DELETE',
        headers: {
          'admin-password': adminPassword,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000),
      });
      
      if (integrationsResponse.ok) {
        results.integrations.success = true;
        console.log("Clear Database: Shopify integrations cleared successfully");
      } else {
        const errorText = await integrationsResponse.text();
        results.integrations.error = `${integrationsResponse.status}: ${errorText}`;
        console.error("Clear Database: Shopify integrations clear failed:", results.integrations.error);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      results.integrations.error = errorMsg;
      console.error("Clear Database: Shopify integrations clear failed:", errorMsg);
    }

    // Calculate overall success
    const successCount = Object.values(results).filter(r => r.success).length;
    const totalCount = Object.keys(results).length;
    const overallSuccess = successCount === totalCount;

    const message = overallSuccess 
      ? `Successfully cleared ${successCount}/${totalCount} database tables`
      : `Cleared ${successCount}/${totalCount} database tables with some errors`;

    console.log(`Clear Database: ${message}`);

    return NextResponse.json({
      success: overallSuccess,
      message,
      results,
      summary: {
        cleared: successCount,
        total: totalCount,
        errors: totalCount - successCount
      }
    });

  } catch (error) {
    console.error("Clear Database: Unexpected error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to clear database",
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}
