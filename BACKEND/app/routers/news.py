# backend/app/routers/news.py

from fastapi import APIRouter
import urllib.request
import xml.etree.ElementTree as ET
import re

router = APIRouter(
    prefix="/news",
    tags=["News"]
)


def get_fallback_news():
    return [
        {
            "title": "Summer Transfer Window opens with major deals on the horizon",
            "link": "https://www.skysports.com/football",
            "description": "Clubs across Europe are preparing blockbuster bids as the transfer window officially swings open.",
            "pub_date": "Tue, 14 Jul 2026 12:00:00 GMT",
            "image_url": None
        },
        {
            "title": "Tactical Analysis: How modern hybrid pressing shapes are evolving",
            "link": "https://www.skysports.com/football",
            "description": "A deep dive into the hybrid pressing structures dominating top-tier European leagues this season.",
            "pub_date": "Tue, 14 Jul 2026 10:00:00 GMT",
            "image_url": None
        },
        {
            "title": "Breakout Stars: Under-21 prospects to watch in the scouting grid",
            "link": "https://www.skysports.com/football",
            "description": "Highlighting five hidden gems under 21 who show high potential ratings and low market valuation.",
            "pub_date": "Tue, 14 Jul 2026 08:30:00 GMT",
            "image_url": None
        }
    ]


@router.get("/football")
def get_football_news():
    url = "https://www.skysports.com/rss/11095"
    headers = {"User-Agent": "Mozilla/5.0"}
    req = urllib.request.Request(url, headers=headers)
    
    try:
        # Fetch RSS XML feed
        with urllib.request.urlopen(req, timeout=5) as response:
            xml_data = response.read()
            
        root = ET.fromstring(xml_data)
        news_items = []
        
        # Parse items (limit to 6 for the dashboard card grid)
        for item in root.findall(".//item")[:6]:
            title = item.find("title").text if item.find("title") is not None else ""
            link = item.find("link").text if item.find("link") is not None else ""
            description = item.find("description").text if item.find("description") is not None else ""
            pub_date = item.find("pubDate").text if item.find("pubDate") is not None else ""
            
            # Clean HTML tags if any from description
            if description:
                description = re.sub(r'<[^>]*>', '', description)
            
            # Look for image
            image_url = None
            enclosure = item.find("enclosure")
            if enclosure is not None:
                image_url = enclosure.attrib.get("url")
            
            # Fallback to yahoo mrss namespace
            if not image_url:
                media_content = item.find("{http://search.yahoo.com/mrss/}content")
                if media_content is not None:
                    image_url = media_content.attrib.get("url")
            
            news_items.append({
                "title": title,
                "link": link,
                "description": description,
                "pub_date": pub_date,
                "image_url": image_url
            })
            
        return news_items
    except Exception as e:
        print(f"Error fetching RSS news feed: {e}")
        return get_fallback_news()
