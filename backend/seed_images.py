"""
FundAI - Add images to all campaigns using picsum.photos
Run AFTER seed_campaigns.py has completed.
Usage: python seed_images.py
"""
import requests
import sqlite3
import os
import uuid
import time

DB_PATH = r"E:\Fund Ai now\backend\fundai.db"
UPLOAD_DIR = r"E:\Fund Ai now\backend\uploads\campaigns"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Category-themed picsum image IDs (curated for quality)
# Each campaign gets a unique image downloaded from picsum.photos
PICSUM_IDS = {
    "Technology": [1, 2, 3, 4, 5, 48, 60, 119, 160, 180],
    "Design": [36, 42, 43, 82, 106, 116, 145, 156, 188, 192],
    "Games": [21, 76, 96, 97, 110, 133, 155, 174, 184, 201],
    "Publishing": [24, 58, 68, 122, 164, 175, 193, 204, 210, 220],
    "Film & Video": [7, 14, 17, 65, 91, 100, 117, 127, 142, 169],
    "Music": [10, 39, 45, 59, 77, 102, 120, 140, 159, 178],
    "Food": [75, 88, 89, 112, 139, 163, 168, 189, 200, 225],
    "Fashion": [15, 64, 92, 111, 128, 146, 157, 177, 195, 219],
    "Comics": [24, 30, 58, 68, 122, 164, 175, 193, 204, 210],
    "Crafts": [36, 37, 40, 41, 44, 47, 80, 84, 94, 103],
}

def download_image(picsum_id, width=800, height=500):
    """Download an image from picsum.photos and save it locally."""
    url = f"https://picsum.photos/id/{picsum_id}/{width}/{height}"
    try:
        r = requests.get(url, timeout=15, allow_redirects=True)
        if r.status_code == 200 and len(r.content) > 1000:
            filename = f"{uuid.uuid4().hex}.jpg"
            filepath = os.path.join(UPLOAD_DIR, filename)
            with open(filepath, "wb") as f:
                f.write(r.content)
            return filename
    except Exception as e:
        print(f"    Download error for id={picsum_id}: {e}")
    return None

conn = sqlite3.connect(DB_PATH)
conn.row_factory = sqlite3.Row
cur = conn.cursor()

# Get all campaigns
cur.execute("SELECT id, name, main_category FROM campaigns")
campaigns = cur.fetchall()
print(f"Found {len(campaigns)} campaigns to add images to.\n")

category_counters = {}

for camp in campaigns:
    cid = camp["id"]
    name = camp["name"][:50]
    cat = camp["main_category"]
    
    # Check if campaign already has images
    cur.execute("SELECT COUNT(*) FROM campaign_images WHERE campaign_id=?", (cid,))
    existing = cur.fetchone()[0]
    if existing > 0:
        print(f"  #{cid} already has {existing} image(s), skipping: {name}")
        continue
    
    # Pick a picsum ID based on category
    ids = PICSUM_IDS.get(cat, PICSUM_IDS["Technology"])
    idx = category_counters.get(cat, 0)
    category_counters[cat] = idx + 1
    picsum_id = ids[idx % len(ids)]
    
    print(f"  #{cid} Downloading image for: {name}...", end=" ", flush=True)
    filename = download_image(picsum_id)
    
    if filename:
        cur.execute(
            "INSERT INTO campaign_images (campaign_id, image_url, is_primary, caption, created_at) VALUES (?, ?, 1, '', datetime('now'))",
            (cid, filename)
        )
        conn.commit()
        print(f"✅ {filename}")
    else:
        print("❌ failed")
    
    time.sleep(0.3)  # Be nice to picsum

conn.close()
print(f"\n✅ Done! Images added to campaigns.")
