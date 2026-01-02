from fastapi import FastAPI, Request, HTTPException, Query, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
import bcrypt
from typing import Optional, List
from contextlib import asynccontextmanager
import os
import re
from datetime import datetime, timedelta
from database import collection, users_collection, connect_to_database, close_database_connection
from models import LinkSchema, LinkUpdate, UserSchema, Token, TokenData
from scraper import process_url
from dotenv import load_dotenv
import logging
import asyncio
from scheduler import start_notification_scheduler

load_dotenv()

# Auth Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 1440))

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Warn if SECRET_KEY is not configured (unsafe for production)
if SECRET_KEY == "your-secret-key":
    logger.warning("SECRET_KEY is set to the default placeholder. Set SECRET_KEY in your environment for production deployments.")

# --- Auth Utilities ---
def verify_password(plain_password, hashed_password):
    try:
        # Truncate to 72 bytes to match the hashing logic
        pwd_bytes = plain_password.encode('utf-8')[:72]
        return bcrypt.checkpw(
            pwd_bytes, 
            hashed_password.encode('utf-8')
        )
    except Exception as e:
        logger.error(f"Password verification error: {e}")
        return False

def get_password_hash(password):
    # Bcrypt has a 72-byte limit. We truncate to ensure it never fails.
    # Most users won't have 72+ char passwords anyway.
    pwd_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    
    user = await users_collection.find_one({"username": token_data.username})
    if user is None:
        raise credentials_exception
    return user

# --- Lifespan Management ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize connections and resources on startup, clean up on shutdown"""
    logger.info("Starting up application...")
    try:
        await connect_to_database()
        
        # Create or update default admin user from environment variables (do NOT hardcode credentials)
        admin_username = os.getenv("ADMIN_USERNAME")
        admin_password = os.getenv("ADMIN_PASSWORD")

        if not admin_username or not admin_password:
            logger.warning("ADMIN_USERNAME or ADMIN_PASSWORD not set; skipping default admin creation. Please create an admin user manually or set these env vars in production.")
        else:
            hashed_password = get_password_hash(admin_password)
            existing_user = await users_collection.find_one({"username": admin_username})

            if not existing_user:
                logger.info(f"Creating default admin user: {admin_username}")
                await users_collection.insert_one({
                    "username": admin_username,
                    "password": hashed_password,
                    "created_at": datetime.utcnow()
                })
                logger.info("Admin user created successfully")
            else:
                # Update password to ensure it matches the current hashing logic
                await users_collection.update_one(
                    {"username": admin_username},
                    {"$set": {"password": hashed_password}}
                )
                logger.info("Admin user password verified/updated")
        
        # Start notification scheduler for reading reminders
        notification_task = start_notification_scheduler()
        
        logger.info("Application startup complete")
    except Exception as e:
        logger.warning(f"Database connection issue: {e}")
        logger.warning("App started but MongoDB may not be available")
    
    yield  # Application runs here
    
    logger.info("Shutting down application...")
    try:
        await close_database_connection()
        logger.info("Application shutdown complete")
    except Exception as e:
        logger.error(f"Error during shutdown: {e}")

app = FastAPI(
    title="E-Library API",
    description="Telegram-powered personal reading library",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")

# --- Health Check ---
@app.get("/")
async def root():
    return {
        "status": "online",
        "service": "E-Library API",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    try:
        # Test MongoDB connection
        await collection.find_one()
        return {
            "status": "healthy",
            "database": "connected",
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=503, detail="Service unavailable")

# --- Auth Endpoints ---
@app.post("/api/auth/register", response_model=Token)
async def register(user: UserSchema):
    """Registration is disabled for security. Only the admin account is allowed."""
    raise HTTPException(status_code=403, detail="Registration is disabled. Use the provided admin credentials.")

@app.post("/api/auth/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Login to get access token"""
    user = await users_collection.find_one({"username": form_data.username})
    if not user or not verify_password(form_data.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["username"]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/auth/me")
async def read_users_me(current_user: dict = Depends(get_current_user)):
    """Get current user info"""
    return {"username": current_user["username"]}

# --- 1. GET Endpoint for Frontend ---
@app.get("/api/links")
async def get_links(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    is_read: Optional[bool] = None,
    is_favorite: Optional[bool] = None,
    is_scheduled: Optional[bool] = None,
    tag: Optional[str] = None,
    search: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """
    Get all links with filtering and pagination
    
    - **skip**: Number of items to skip (pagination)
    - **limit**: Max items to return (max 100)
    - **is_read**: Filter by read status
    - **is_favorite**: Filter by favorite status
    - **is_scheduled**: Filter by scheduled status
    - **tag**: Filter by specific tag
    - **search**: Search in title, summary, and content
    """
    try:
        # Build filter query
        query = {}
        
        if is_read is not None:
            query["is_read"] = is_read
        
        if is_favorite is not None:
            query["is_favorite"] = is_favorite

        if is_scheduled is not None:
            if is_scheduled:
                query["scheduled_at"] = {"$ne": None}
            else:
                query["scheduled_at"] = None
        
        if tag:
            query["tags"] = tag
        
        if search:
            query["$or"] = [
                {"title": {"$regex": search, "$options": "i"}},
                {"summary": {"$regex": search, "$options": "i"}},
                {"content": {"$regex": search, "$options": "i"}}
            ]
        
        # Get total count
        total = await collection.count_documents(query)
        
        # Get paginated results
        links = []
        cursor = collection.find(query).sort("created_at", -1).skip(skip).limit(limit)
        async for document in cursor:
            document["id"] = str(document["_id"])
            del document["_id"]
            links.append(document)
        
        return {
            "links": links,
            "total": total,
            "skip": skip,
            "limit": limit
        }
    except Exception as e:
        logger.error(f"Error fetching links: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/links/{link_id}")
async def get_link(link_id: str, current_user: dict = Depends(get_current_user)):
    """Get single link by ID"""
    from bson import ObjectId
    try:
        link = await collection.find_one({"_id": ObjectId(link_id)})
        if not link:
            raise HTTPException(status_code=404, detail="Link not found")
        
        link["id"] = str(link["_id"])
        del link["_id"]
        return link
    except Exception as e:
        logger.error(f"Error fetching link {link_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.patch("/api/links/{link_id}")
async def update_link(link_id: str, update: LinkUpdate, current_user: dict = Depends(get_current_user)):
    """Update link properties (read status, favorite, tags)"""
    from bson import ObjectId
    try:
        update_data = {k: v for k, v in update.dict().items() if v is not None}
        update_data["updated_at"] = datetime.utcnow()
        
        result = await collection.update_one(
            {"_id": ObjectId(link_id)},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Link not found")
        
        return {"status": "updated", "id": link_id}
    except Exception as e:
        logger.error(f"Error updating link {link_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/links/{link_id}")
async def delete_link(link_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a link"""
    from bson import ObjectId
    try:
        result = await collection.delete_one({"_id": ObjectId(link_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Link not found")
        
        return {"status": "deleted", "id": link_id}
    except Exception as e:
        logger.error(f"Error deleting link {link_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/tags")
async def get_all_tags(current_user: dict = Depends(get_current_user)):
    """Get all unique tags from the database"""
    try:
        tags = await collection.distinct("tags")
        return {"tags": sorted(tags)}
    except Exception as e:
        logger.error(f"Error fetching tags: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stats")
async def get_statistics(current_user: dict = Depends(get_current_user)):
    """Get library statistics"""
    try:
        total = await collection.count_documents({})
        read = await collection.count_documents({"is_read": True})
        favorites = await collection.count_documents({"is_favorite": True})
        scheduled = await collection.count_documents({"scheduled_at": {"$ne": None}})
        
        return {
            "total_links": total,
            "read": read,
            "unread": total - read,
            "favorites": favorites,
            "scheduled": scheduled
        }
    except Exception as e:
        logger.error(f"Error fetching stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- Telegram Webhook ---
@app.post("/webhooks/telegram")
async def telegram_webhook(request: Request):
    """
    Telegram Bot webhook endpoint
    Receives messages from Telegram groups/chats and extracts URLs automatically
    """
    try:
        data = await request.json()
        logger.info(f"Received Telegram webhook: {data}")
        
        # Telegram update structure is much simpler than WhatsApp
        message = data.get("message")
        
        if not message:
            logger.info("No message in webhook payload")
            return {"ok": True}
        
        # Extract message details
        text = message.get("text", "")
        chat_id = message.get("chat", {}).get("id")
        chat_type = message.get("chat", {}).get("type")  # group, supergroup, private
        
        if not text:
            logger.info("No text in message")
            return {"ok": True}
        
        logger.info(f"Processing message from {chat_type}: {text[:100]}...")
        
        # Regex to find URLs
        urls = re.findall(r'https?://\S+', text)
        
        if not urls:
            logger.info("No URLs found in message")
            return {"ok": True}
        
        processed_count = 0
        
        for url in urls:
            # Clean URL (remove trailing punctuation)
            url = url.rstrip('.,;:!?')
            
            logger.info(f"📥 Processing URL: {url}")
            
            # Check duplication in DB
            existing = await collection.find_one({"url": url})
            if existing:
                logger.warning(f"⚠️ URL already exists in DB: {url}")
                continue
            
            # Extract metadata from URL
            logger.info(f"🔍 Extracting metadata from: {url}")
            metadata = process_url(url)
            
            # Save to MongoDB
            new_link = LinkSchema(
                url=url,
                title=metadata["title"],
                summary=metadata["summary"],
                content=metadata.get("content"),
                author=metadata.get("author"),
                tags=metadata.get("tags", []),
                domain=metadata.get("domain"),
                reading_time=metadata.get("reading_time", 0),
                image_url=metadata.get("image_url"),
                video_url=metadata.get("video_url"),
                source="telegram",
                nested_links=metadata.get("nested_links", [])
            )
            
            await collection.insert_one(new_link.dict())
            logger.info(f"✅ Saved: {metadata['title']} with {len(metadata.get('nested_links', []))} nested links")
            processed_count += 1
        
        return {
            "ok": True,
            "urls_processed": processed_count,
            "urls_found": len(urls)
        }
    
    except Exception as e:
        logger.error(f"Error processing Telegram webhook: {e}", exc_info=True)
        # Always return 200 to Telegram
        return {"ok": True, "error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
