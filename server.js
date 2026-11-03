require('dotenv').config();
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const db = require('./config/db');
const getSwaggerSpec = require('./config/swagger');
const healthRoutes = require('./routes/healthRoutes');
const apiRoutes = require('./routes/apiRoutes');
const { apiKeyAuth } = require('./middleware/auth');

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 5000;

// Enable Cross-Origin Resource Sharing
app.use(cors());

// Parse incoming JSON and URL-encoded payloads
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple request logger
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  next();
});

// Build Swagger / OpenAPI specification
const swaggerSpec = getSwaggerSpec(PORT);

// Serve raw Swagger JSON specification
app.get('/api-docs/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Serve interactive Swagger UI documentation at /api-docs and /docs
const swaggerOptions = {
  customSiteTitle: 'Oracle Data API - Swagger UI Documentation',
  customCss: '.swagger-ui .topbar { display: block; background-color: #1a365d; }',
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerOptions));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerOptions));

// Root welcome route with tool/endpoint dictionary for AI agents
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Oracle Data API is running',
    version: '1.5.0',
    documentation: {
      interactiveSwaggerUi: `http://localhost:${PORT}/api-docs`,
      openApiSpecJson: `http://localhost:${PORT}/api-docs/swagger.json`,
      healthAndSecurityCheck: `http://localhost:${PORT}/api/health`,
    },
    endpoints: {
      health: 'GET /api/health',
      bomExplosion: {
        path: 'GET /api/bom/explosion',
        description: 'BOM hierarchy explosion with RM, MFG, on-hand quantities',
        parameters: ['itemNumber', 'orgId', 'limit'],
      },
      inwardGateEntry: {
        path: 'GET /api/gate-entry/inward',
        description: 'Inward gate entries, vehicle, challan, vendor, and GRN reconciliation',
        parameters: ['startDate', 'endDate', 'vehicleNumber', 'vendorName', 'grn', 'status', 'locationId', 'limit'],
      },
      outwardGateEntry: {
        path: 'GET /api/gate-entry/outward',
        description: 'Outward gate entries, vehicle, customer, excise invoice, and dispatch flags',
        parameters: ['startDate', 'endDate', 'customer', 'vehicleNumber', 'gateEntryNumber', 'invoiceNo', 'flag', 'locationId', 'limit'],
      },
      pendingPurchaseOrders: {
        path: 'GET /api/purchase-orders/pending',
        description: 'Approved pending POs and blanket releases with remaining balance quantity > 0',
        parameters: ['itemNumber', 'poNum', 'supplier', 'orgId', 'operatingUnitId', 'limit'],
      },
    },
    mockMode: process.env.USE_MOCK_DATA === 'true',
    security: {
      isSecure: true,
      authEnforced: Boolean(process.env.API_KEY && process.env.API_KEY.trim() !== ''),
    },
  });
});

// Health check route (unauthenticated so monitoring systems can ping it)
app.use('/api', healthRoutes);

// Protected business API routes (enforces API key if configured in .env)
app.use('/api', apiKeyAuth, apiRoutes);

// Catch 404 - Not Found
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    hint: `View available routes and test endpoints in Swagger UI: http://localhost:${PORT}/api-docs`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Application Error:', err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

let serverInstance;

/**
 * Start the application server and initialize the Oracle connection pool
 */
async function startServer() {
  try {
    // Attempt Oracle connection pool initialization (graceful fallback if mock mode is on)
    await db.initializePool();

    serverInstance = app.listen(PORT, () => {
      console.log('====================================================');
      console.log(`🚀 Oracle Data API Server running on port ${PORT}`);
      console.log(`🌐 Base URL: http://localhost:${PORT}`);
      console.log(`📖 Interactive Swagger UI: http://localhost:${PORT}/api-docs`);
      console.log(`🩺 Health & Security Check: http://localhost:${PORT}/api/health`);
      console.log(`🧪 Mock Data Mode: ${process.env.USE_MOCK_DATA === 'true' ? 'ENABLED' : 'DISABLED'}`);
      console.log('====================================================');
    });
  } catch (error) {
    console.error('❌ Critical startup failure:', error.message);
    process.exit(1);
  }
}

/**
 * Graceful shutdown handling
 */
async function handleShutdown(signal) {
  console.log(`\n🛑 Received ${signal}. Gracefully shutting down...`);
  if (serverInstance) {
    serverInstance.close(async () => {
      console.log('🔒 HTTP server closed.');
      await db.closePool();
      console.log('👋 Process exiting cleanly.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
}

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

startServer();

module.exports = app;
