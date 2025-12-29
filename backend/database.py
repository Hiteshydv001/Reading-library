import motor.motor_asyncio
import os
import ssl
import certifi
from dotenv import load_dotenv
import logging

load_dotenv()
logger = logging.getLogger(__name__)

# Validate required environment variables
required_env_vars = ["MONGODB_URL", "DB_NAME"]
for var in required_env_vars:
    if not os.getenv(var):
        raise ValueError(f"Missing required environment variable: {var}")

# Production-ready MongoDB client with connection pooling and timeouts
def get_mongodb_client():
    """
    Create MongoDB client with production-ready settings:
    - Connection pooling (max 50 connections)
    - Automatic retries
    - Timeouts for operations
    - SSL/TLS configuration for Windows compatibility
    """
    try:
        # Simplified connection without custom SSL context (Windows compatibility)
        client = motor.motor_asyncio.AsyncIOMotorClient(
            os.getenv("MONGODB_URL"),
            maxPoolSize=50,  # Connection pool size
            minPoolSize=10,  # Minimum connections
            maxIdleTimeMS=30000,  # Close idle connections after 30s
            serverSelectionTimeoutMS=5000,  # Timeout for selecting server
            connectTimeoutMS=10000,  # Connection timeout
            socketTimeoutMS=20000,  # Socket timeout
            retryWrites=True,  # Retry failed writes
            retryReads=True,  # Retry failed reads
            tls=True,  # Enable TLS
            tlsAllowInvalidCertificates=True  # Windows SSL workaround
        )
        logger.info("MongoDB client initialized with production settings")
        return client
    except Exception as e:
        logger.error(f"Error creating MongoDB client: {e}")
        # Return basic client as fallback
        return motor.motor_asyncio.AsyncIOMotorClient(
            os.getenv("MONGODB_URL"),
            tls=True,
            tlsAllowInvalidCertificates=True
        )

# Initialize client
client = get_mongodb_client()
db = client[os.getenv("DB_NAME")]
collection = db.get_collection("links")
users_collection = db.get_collection("users")

# Async lifecycle management
async def connect_to_database():
    """Test database connection on startup"""
    try:
        await client.admin.command('ping')
        logger.info("Successfully connected to MongoDB")
    except Exception as e:
        logger.warning(f"Failed to connect to MongoDB: {e}")
        logger.warning("App will start but database operations will fail until connection is fixed")

async def close_database_connection():
    """Close database connections gracefully on shutdown"""
    try:
        client.close()
        logger.info("Database connection closed")
    except Exception as e:
        logger.error(f"Error closing database connection: {e}")