from pydantic import BaseModel, Field, HttpUrl, validator
from typing import Optional, List
from datetime import datetime

class LinkSchema(BaseModel):
    url: str
    title: str = "No Title"
    summary: Optional[str] = None
    content: Optional[str] = None  # Full extracted content
    tags: List[str] = Field(default_factory=list)  # Auto-generated tags
    source: str = "whatsapp"
    domain: Optional[str] = None  # e.g., "arxiv.org"
    author: Optional[str] = None
    reading_time: Optional[int] = None  # Minutes
    image_url: Optional[str] = None
    video_url: Optional[str] = None
    is_read: bool = False
    is_favorite: bool = False
    nested_links: List[str] = Field(default_factory=list)
    scheduled_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    @validator('url')
    def validate_url(cls, v):
        if not v.startswith(('http://', 'https://')):
            raise ValueError('URL must start with http:// or https://')
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "url": "https://arxiv.org/abs/1706.03762",
                "title": "Attention Is All You Need",
                "summary": "The dominant sequence transduction models...",
                "tags": ["AI", "Machine Learning", "NLP"],
                "source": "whatsapp",
                "domain": "arxiv.org",
                "reading_time": 15
            }
        }

class LinkUpdate(BaseModel):
    """Schema for updating link properties"""
    is_read: Optional[bool] = None
    is_favorite: Optional[bool] = None
    tags: Optional[List[str]] = None
    scheduled_at: Optional[datetime] = None

class WebhookPayload(BaseModel):
    """WhatsApp Cloud API webhook payload structure"""
    object: str
    entry: List[dict]

class UserSchema(BaseModel):
    username: str
    password: str  # Hashed in DB

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None