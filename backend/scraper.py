import trafilatura
import re
from urllib.parse import urlparse, parse_qs
from typing import Dict, List
import json
import requests
from lxml import html

def extract_media(url: str, html_content: str) -> Dict:
    """Extract image and video previews using OpenGraph and specific patterns"""
    media = {"image_url": None, "video_url": None}
    
    try:
        tree = html.fromstring(html_content)
        
        # 1. Try OpenGraph Image
        og_image = tree.xpath('//meta[@property="og:image"]/@content')
        if og_image:
            media["image_url"] = og_image[0]
            
        # 2. Try YouTube Video
        if "youtube.com" in url or "youtu.be" in url:
            video_id = None
            if "youtube.com" in url:
                video_id = parse_qs(urlparse(url).query).get('v', [None])[0]
            else:
                video_id = urlparse(url).path.lstrip('/')
            
            if video_id:
                media["video_url"] = f"https://www.youtube.com/embed/{video_id}"
                # YouTube thumbnail as fallback
                if not media["image_url"]:
                    media["image_url"] = f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg"
        
        # 3. Try OpenGraph Video
        og_video = tree.xpath('//meta[@property="og:video"]/@content')
        if og_video and not media["video_url"]:
            media["video_url"] = og_video[0]
            
    except Exception:
        pass
        
    return media

def extract_domain(url: str) -> str:
    """Extract clean domain from URL"""
    try:
        parsed = urlparse(url)
        domain = parsed.netloc
        # Remove www. prefix
        if domain.startswith('www.'):
            domain = domain[4:]
        return domain
    except:
        return "unknown"

def calculate_reading_time(text: str) -> int:
    """Calculate reading time in minutes (avg 200 words/min)"""
    if not text:
        return 0
    word_count = len(text.split())
    return max(1, round(word_count / 200))

def auto_tag(title: str, text: str, domain: str) -> List[str]:
    """Generate relevant tags based on content"""
    tags = set()
    
    # Domain-based tags
    domain_map = {
        "arxiv.org": ["Research", "Academic"],
        "github.com": ["Code", "Development"],
        "medium.com": ["Article", "Blog"],
        "youtube.com": ["Video"],
        "twitter.com": ["Social"],
        "x.com": ["Social"],
        "linkedin.com": ["Social", "Professional"],
        "reddit.com": ["Discussion"],
        "stackoverflow.com": ["Programming", "Q&A"]
    }
    
    for domain_key, domain_tags in domain_map.items():
        if domain_key in domain:
            tags.update(domain_tags)
    
    # Keyword-based tagging
    combined_text = f"{title} {text}".lower()
    
    keyword_map = {
        "AI": ["ai", "artificial intelligence", "machine learning", "deep learning"],
        "NLP": ["nlp", "natural language", "language model", "transformer", "gpt", "llm"],
        "Computer Vision": ["computer vision", "image recognition", "object detection"],
        "Data Science": ["data science", "data analysis", "analytics"],
        "Python": ["python", "pytorch", "tensorflow"],
        "JavaScript": ["javascript", "react", "node.js", "typescript"],
        "Cloud": ["cloud", "aws", "azure", "gcp"],
        "Database": ["database", "sql", "mongodb", "postgres"],
        "Security": ["security", "encryption", "authentication"],
        "DevOps": ["devops", "docker", "kubernetes", "ci/cd"],
        "Tutorial": ["tutorial", "guide", "how to", "introduction"],
        "Research": ["research", "paper", "study", "analysis"]
    }
    
    for tag, keywords in keyword_map.items():
        if any(keyword in combined_text for keyword in keywords):
            tags.add(tag)
    
    # Limit to top 5 tags
    return list(tags)[:5]

def process_url(url: str) -> Dict:
    """
    Downloads URL and extracts comprehensive metadata.
    Returns dict with title, summary, content, author, tags, domain, reading_time
    """
    try:
        # Download content
        downloaded = trafilatura.fetch_url(url)
        if downloaded is None:
            return {
                "title": "Error: Unable to fetch content",
                "summary": "Could not download content from URL.",
                "content": None,
                "author": None,
                "tags": ["Error"],
                "domain": extract_domain(url),
                "reading_time": 0
            }
        
        # Extract with metadata
        result = trafilatura.extract(
            downloaded,
            output_format="json",
            with_metadata=True,
            include_comments=False,
            include_tables=False
        )
        
        if not result:
            return {
                "title": "No Content Extracted",
                "summary": "Unable to extract text from this URL.",
                "content": None,
                "author": None,
                "tags": [],
                "domain": extract_domain(url),
                "reading_time": 0
            }

        data = json.loads(result)
        
        # Extract fields
        title = data.get("title") or "No Title"
        author = data.get("author")
        text = data.get("text", "") or ""
        
        # Generate summary (first 400 chars)
        summary = text[:400] + "..." if len(text) > 400 else text
        
        # Calculate reading time
        reading_time = calculate_reading_time(text)
        
        # Extract domain
        domain = extract_domain(url)
        
        # Extract Media (Images/Videos)
        media = extract_media(url, downloaded)
        
        # Auto-generate tags
        tags = auto_tag(title, text, domain)

        # Find nested links in the text
        nested_links = []
        if text:
            # Find all URLs in the text
            found_urls = re.findall(r'https?://[^\s<>"]+|www\.[^\s<>"]+', text)
            # Filter out the original URL and duplicates
            nested_links = list(set([u for u in found_urls if u != url]))

        return {
            "title": title,
            "summary": summary,
            "content": text,  # Full content for search
            "author": author,
            "tags": tags,
            "domain": domain,
            "reading_time": reading_time,
            "image_url": media["image_url"],
            "video_url": media["video_url"],
            "nested_links": nested_links
        }

    except Exception as e:
        return {
            "title": "Error Processing URL",
            "summary": f"Exception: {str(e)}",
            "content": None,
            "author": None,
            "tags": ["Error"],
            "domain": extract_domain(url),
            "reading_time": 0
        }