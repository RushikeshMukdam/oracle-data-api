/**
 * OpenAPI 3.0 Specification for Oracle Data API
 */

function getSwaggerSpec(port = 5000) {
  return {
    openapi: '3.0.0',
    info: {
      title: 'Oracle Data API (oracle-data-api)',
      version: '1.0.0',
      description: `
### Enterprise REST API for Oracle EBS / ERP
This API provides audited, high-performance endpoints to fetch live manufacturing, supply chain, and logistics data from Oracle EBS.
Built specifically as a **Tool Layer for AI Chatbots (e.g., Saksham AI)** with full **Mock Data Mode** for offline development.

#### Key Features:
- **100% Parameterized Queries**: Named bind variables (:itemNumber, :startDate) protect against SQL injection.
- **Connection Pool Management**: Built-in pooling with automatic connection release in \`finally\` blocks.
- **Mock Mode Fallback**: Works immediately without Oracle credentials.
- **Interactive Swagger UI**: Test queries directly using the 'Try it out' buttons below.
      `,
      contact: {
        name: 'Enterprise IT & AI Development Team',
      },
    },
    servers: [
      {
        url: `http://localhost:${port}`,
        description: 'Local API Server',
      },
    ],
    tags: [
      {
        name: 'Diagnostics & Security',
        description: 'Health checks, database pool status, and security audit reports',
      },
      {
        name: 'Query 1: BOM Hierarchy',
        description: 'Multi-level Bill of Materials hierarchy, parent/child quantities & inventory stock',
      },
      {
        name: 'Query 2: Inward Gate Entry',
        description: 'Vendor shipments entering the factory, vehicle numbers, challans, and GRN receipts',
      },
      {
        name: 'Query 3: Outward Gate Entry',
        description: 'Finished goods dispatches to customers, vehicle numbers, and excise invoices',
      },
      {
        name: 'Query 4: Purchase Orders',
        description: 'Approved POs and blanket releases with balance remaining quantity > 0',
      },
    ],
    paths: {
      '/api/health': {
        get: {
          tags: ['Diagnostics & Security'],
          summary: 'Check API and Database Health with Security Audit',
          description: 'Reports system uptime, database connection status, and detailed security verification (SQL injection protection, credential safety, connection leak prevention).',
          responses: {
            200: {
              description: 'System is healthy and secure',
              content: {
                'application/json': {
                  example: {
                    status: 'UP',
                    timestamp: '2026-11-02T14:45:00.000Z',
                    uptimeSeconds: 120,
                    environment: 'development',
                    mockMode: true,
                    database: {
                      poolActive: false,
                      configuredHost: 'localhost:1521/ORCLPDB1',
                    },
                    security: {
                      isSecure: true,
                      sqlInjectionProtected: true,
                      credentialsExposed: false,
                      connectionLeakProtected: true,
                      corsEnabled: true,
                      authentication: 'OPTIONAL (Set API_KEY in .env to enforce)',
                    },
                  },
                },
              },
            },
          },
        },
      },

      '/api/bom/explosion': {
        get: {
          tags: ['Query 1: BOM Hierarchy'],
          summary: 'Query 1: BOM Hierarchy Explosion',
          description: 'Traverses the Oracle EBS BOM hierarchy for a given assembly item and organization ID, computing multi-level paths, parent/child quantities, and inventory stock balances (RM, MFG, On-hand).',
          parameters: [
            {
              name: 'itemNumber',
              in: 'query',
              description: 'Top-level assembly item part number (segment1)',
              required: false,
              schema: { type: 'string', default: '22305174' },
              example: '22305174',
            },
            {
              name: 'orgId',
              in: 'query',
              description: 'Inventory organization ID',
              required: false,
              schema: { type: 'integer', default: 82 },
              example: 82,
            },
            {
              name: 'childItem',
              in: 'query',
              description: 'Filter by specific child component code (mock mode filter)',
              required: false,
              schema: { type: 'string' },
              example: 'RAW-STL-402',
            },
            {
              name: 'limit',
              in: 'query',
              description: 'Maximum number of records to return',
              required: false,
              schema: { type: 'integer', default: 50 },
              example: 50,
            },
          ],
          responses: {
            200: {
              description: 'BOM hierarchy records fetched successfully',
            },
            400: {
              description: 'Invalid input parameters',
            },
          },
        },
      },

      '/api/gate-entry/inward': {
        get: {
          tags: ['Query 2: Inward Gate Entry'],
          summary: 'Query 2: Inward Gate Entry & GRN Receipts',
          description: 'Fetches raw material and supplier shipments arriving at the factory gate, including vehicle number, transporter, challan, vendor name, and receiving GRN.',
          parameters: [
            {
              name: 'startDate',
              in: 'query',
              description: 'Start entry date filter (YYYY-MM-DD)',
              required: false,
              schema: { type: 'string', default: '2026-07-01' },
              example: '2026-07-01',
            },
            {
              name: 'endDate',
              in: 'query',
              description: 'End entry date filter (YYYY-MM-DD)',
              required: false,
              schema: { type: 'string', default: '2026-08-01' },
              example: '2026-08-01',
            },
            {
              name: 'vehicleNumber',
              in: 'query',
              description: 'Filter by truck / vehicle registration number',
              required: false,
              schema: { type: 'string' },
              example: 'MH-12-RN-4821',
            },
            {
              name: 'vendorName',
              in: 'query',
              description: 'Filter by vendor name (partial match)',
              required: false,
              schema: { type: 'string' },
              example: 'Bharat Forge',
            },
            {
              name: 'grn',
              in: 'query',
              description: 'Filter by Goods Receipt Note (GRN) number',
              required: false,
              schema: { type: 'string' },
              example: '5001284',
            },
            {
              name: 'locationId',
              in: 'query',
              description: 'Plant location ID',
              required: false,
              schema: { type: 'integer', default: 82 },
              example: 82,
            },
            {
              name: 'limit',
              in: 'query',
              description: 'Maximum records to return',
              required: false,
              schema: { type: 'integer', default: 100 },
              example: 100,
            },
          ],
          responses: {
            200: {
              description: 'Inward gate entries fetched successfully',
            },
            400: {
              description: 'Invalid date or parameter format',
            },
          },
        },
      },

      '/api/gate-entry/outward': {
        get: {
          tags: ['Query 3: Outward Gate Entry'],
          summary: 'Query 3: Outward Gate Entry & Customer Dispatches',
          description: 'Fetches finished goods dispatches leaving the factory for customers, with vehicle number, transporter, customer name, and excise invoices.',
          parameters: [
            {
              name: 'startDate',
              in: 'query',
              description: 'Start entry date filter (YYYY-MM-DD)',
              required: false,
              schema: { type: 'string', default: '2026-08-01' },
              example: '2026-08-01',
            },
            {
              name: 'endDate',
              in: 'query',
              description: 'End entry date filter (YYYY-MM-DD)',
              required: false,
              schema: { type: 'string', default: '2026-09-01' },
              example: '2026-09-01',
            },
            {
              name: 'customer',
              in: 'query',
              description: 'Filter by customer name (partial match)',
              required: false,
              schema: { type: 'string' },
              example: 'Mahindra',
            },
            {
              name: 'vehicleNumber',
              in: 'query',
              description: 'Filter by truck / vehicle registration number',
              required: false,
              schema: { type: 'string' },
              example: 'MH-14-GH-4411',
            },
            {
              name: 'invoiceNo',
              in: 'query',
              description: 'Filter by excise invoice number',
              required: false,
              schema: { type: 'string' },
              example: 'INV-26-8801',
            },
            {
              name: 'limit',
              in: 'query',
              description: 'Maximum records to return',
              required: false,
              schema: { type: 'integer', default: 100 },
              example: 100,
            },
          ],
          responses: {
            200: {
              description: 'Outward gate entries fetched successfully',
            },
            400: {
              description: 'Invalid date or parameter format',
            },
          },
        },
      },

      '/api/purchase-orders/pending': {
        get: {
          tags: ['Query 4: Purchase Orders'],
          summary: 'Query 4: Pending Purchase Orders',
          description: 'Fetches approved purchase orders and blanket releases where balance remaining quantity > 0, unit price, PO quantities, and supplier details.',
          parameters: [
            {
              name: 'itemNumber',
              in: 'query',
              description: 'Filter by item part number (segment1)',
              required: false,
              schema: { type: 'string' },
              example: '22305174',
            },
            {
              name: 'supplier',
              in: 'query',
              description: 'Filter by vendor / supplier name (partial match)',
              required: false,
              schema: { type: 'string' },
              example: 'Tata Steel',
            },
            {
              name: 'poNum',
              in: 'query',
              description: 'Filter by PO number',
              required: false,
              schema: { type: 'string' },
              example: 'PO-2026-4401',
            },
            {
              name: 'orgId',
              in: 'query',
              description: 'Inventory organization ID',
              required: false,
              schema: { type: 'integer', default: 82 },
              example: 82,
            },
            {
              name: 'operatingUnitId',
              in: 'query',
              description: 'Operating unit org ID',
              required: false,
              schema: { type: 'integer', default: 81 },
              example: 81,
            },
            {
              name: 'limit',
              in: 'query',
              description: 'Maximum records to return',
              required: false,
              schema: { type: 'integer', default: 100 },
              example: 100,
            },
          ],
          responses: {
            200: {
              description: 'Pending purchase orders fetched successfully',
            },
            400: {
              description: 'Invalid parameter format',
            },
          },
        },
      },
    },
  };
}

module.exports = getSwaggerSpec;

