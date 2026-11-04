require('dotenv').config();
const fs = require('fs');
const path = require('path');
const oracledb = require('oracledb');

// Enable Thick Mode (required for Oracle Native Network Encryption / Data Integrity / ANO)
function initOracleClientMode() {
  try {
    let libDir = process.env.ORACLE_CLIENT_LIB_DIR;
    if (!libDir && process.platform === 'win32') {
      const defaultPaths = [
        'C:\\oracle\\instantclient_19_30',
        'C:\\oracle',
        'C:\\instantclient_19_30',
      ];
      for (const p of defaultPaths) {
        if (fs.existsSync(p) && fs.existsSync(path.join(p, 'oci.dll'))) {
          libDir = p;
          break;
        }
      }
    }

    if (libDir) {
      oracledb.initOracleClient({ libDir });
    } else if (process.env.ENABLE_THICK_MODE === 'true') {
      oracledb.initOracleClient();
    }
  } catch (err) {
    if (!err.message.includes('already been called')) {
      console.warn(`⚠️  Oracle Client initialization: ${err.message}`);
    }
  }
}

initOracleClientMode();

/**
 * Diagnostic utility to test direct Oracle Database connectivity
 * Run via: node test-db-connection.js
 */
async function testConnection() {
  console.log('====================================================');
  console.log('🔍 Oracle Database Connectivity Diagnostic Tool');
  console.log('====================================================');

  const { DB_USER, DB_PASSWORD, DB_CONNECT_STRING } = process.env;

  console.log('\n1. Checking Environment Variables:');
  console.log(`   - DB_USER:           ${DB_USER ? DB_USER : '❌ MISSING'}`);
  console.log(`   - DB_PASSWORD:       ${DB_PASSWORD ? '******** (Provided)' : '❌ MISSING'}`);
  console.log(`   - DB_CONNECT_STRING: ${DB_CONNECT_STRING ? DB_CONNECT_STRING : '❌ MISSING'}`);

  if (!DB_USER || !DB_PASSWORD || !DB_CONNECT_STRING) {
    console.log('\n❌ FAILED: One or more database credentials are missing in .env');
    console.log('👉 Please edit .env and provide DB_USER, DB_PASSWORD, and DB_CONNECT_STRING.');
    process.exit(1);
  }

  console.log(`\n2. Attempting to connect to Oracle Database (${oracledb.thin ? 'Thin Mode' : 'Thick Mode - OCI: ' + (process.env.ORACLE_CLIENT_LIB_DIR || 'C:\\oracle\\instantclient_19_30')})...`);
  let connection;

  try {
    const startTime = Date.now();
    connection = await oracledb.getConnection({
      user: DB_USER,
      password: DB_PASSWORD,
      connectString: DB_CONNECT_STRING,
    });

    const elapsed = Date.now() - startTime;
    console.log(`✅ SUCCESS: Connected to Oracle Database in ${elapsed} ms!`);

    console.log('\n3. Running test query (SELECT SYSDATE, BANNER FROM v$version)...');
    let versionBanner = 'Unknown Oracle Version';
    try {
      const verResult = await connection.execute(
        "SELECT BANNER FROM v$version WHERE ROWNUM = 1",
        [],
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      if (verResult.rows && verResult.rows.length > 0) {
        versionBanner = verResult.rows[0].BANNER || JSON.stringify(verResult.rows[0]);
      }
    } catch {
      // Fallback if user doesn't have privileges on v$version
      const dualResult = await connection.execute(
        "SELECT TO_CHAR(SYSDATE, 'YYYY-MM-DD HH24:MI:SS') AS SERVER_TIME FROM dual",
        [],
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      versionBanner = `Dual Query Success (Server Time: ${dualResult.rows[0].SERVER_TIME})`;
    }

    console.log(`   - Database Response: ${versionBanner}`);
    console.log('\n🎉 ALL CHECKS PASSED: Your project is ready to query the live database!');
    console.log('👉 In your .env file, ensure USE_MOCK_DATA=false and run: npm start\n');

  } catch (error) {
    console.error('\n❌ CONNECTION FAILED:');
    console.error(`   Error Code:    ${error.errorNum || 'N/A'}`);
    console.error(`   Error Message: ${error.message}`);

    console.log('\n🛠️  Troubleshooting Guide:');
    if (error.message.includes('ORA-01017')) {
      console.log('   👉 ORA-01017: Invalid username or password.');
      console.log('      Double check DB_USER and DB_PASSWORD in your .env file.');
    } else if (error.message.includes('ORA-12541') || error.message.includes('ECONNREFUSED')) {
      console.log('   👉 ORA-12541 / ECONNREFUSED: No listener on that IP/port.');
      console.log('      Verify the host IP address and port (default is 1521).');
    } else if (error.message.includes('ORA-12514') || error.message.includes('ORA-12154')) {
      console.log('   👉 ORA-12514 / ORA-12154: The database service name or SID does not exist.');
      console.log('      Verify the Service Name after the slash (e.g. host:1521/SERVICE_NAME).');
    } else if (error.message.includes('ETIMEDOUT')) {
      console.log('   👉 ETIMEDOUT: Network timeout.');
      console.log('      - Are you connected to the office network or client VPN?');
      console.log('      - Has the client firewall whitelisted your current IP address?');
    } else {
      console.log('   👉 Check your network connection, IP whitelisting, and Oracle TNS credentials.');
    }
    console.log();
  } finally {
    if (connection) {
      await connection.close();
      console.log('🔒 Test connection closed cleanly.');
    }
  }
}

testConnection();

