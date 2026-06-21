"""
FundAI - Campaign Seed Data
Run this script to populate the database with 20+ realistic campaigns.
Usage: python seed_campaigns.py
"""
import requests
import random
import time

BASE = "http://localhost:5000/api"

# ── Ensure we have creator accounts ──────────────────────────────
creators = [
    {"email": "sarah.chen@fundai.com",   "password": "creator1", "name": "Sarah Chen",      "role": "creator"},
    {"email": "james.wilson@fundai.com", "password": "creator1", "name": "James Wilson",    "role": "creator"},
    {"email": "luna.park@fundai.com",    "password": "creator1", "name": "Luna Park",       "role": "creator"},
    {"email": "omar.hassan@fundai.com",  "password": "creator1", "name": "Omar Hassan",     "role": "creator"},
    {"email": "emma.davis@fundai.com",   "password": "creator1", "name": "Emma Davis",      "role": "creator"},
]

creator_ids = []
for c in creators:
    r = requests.post(f"{BASE}/auth/signup", json=c)
    if r.status_code == 201:
        uid = r.json()["user"]["id"]
        creator_ids.append(uid)
        print(f"  ✅ Created creator: {c['name']} (id={uid})")
    elif r.status_code == 409:
        # Already exists — login to get id
        r2 = requests.post(f"{BASE}/auth/login", json={"email": c["email"], "password": c["password"]})
        if r2.status_code == 200:
            uid = r2.json()["user"]["id"]
            creator_ids.append(uid)
            print(f"  ♻️  Existing creator: {c['name']} (id={uid})")
        else:
            print(f"  ⚠️  Could not login {c['name']}: {r2.text[:80]}")
    else:
        print(f"  ⚠️  Signup failed for {c['name']}: {r.text[:80]}")

if not creator_ids:
    print("ERROR: No creator accounts available!")
    exit(1)

# ── Campaign data ────────────────────────────────────────────────
CAMPAIGNS = [
    {
        "name": "AquaPure: Smart Water Purification Bottle",
        "blurb": "A portable smart bottle that purifies any water source in 60 seconds using UV-C and nano-filtration technology.",
        "description": "AquaPure combines cutting-edge UV-C LED sterilization with a nano-membrane filter to give you clean, safe drinking water anywhere. Perfect for travelers, hikers, and emergency preparedness. Our patented dual-filtration removes 99.99% of bacteria and viruses.",
        "usd_goal": 25000, "duration_days": 30, "prep_days": 45,
        "main_category": "Technology", "country": "US", "has_video": True,
    },
    {
        "name": "NovaBeat Wireless Earbuds",
        "blurb": "Premium wireless earbuds with spatial audio, 40-hour battery, and active noise cancellation for audiophiles on the go.",
        "description": "NovaBeat delivers studio-grade sound in a compact form factor. Featuring custom 12mm beryllium drivers, Bluetooth 5.4, and AI-powered noise cancellation that adapts to your environment in real-time.",
        "usd_goal": 50000, "duration_days": 35, "prep_days": 60,
        "main_category": "Technology", "country": "US", "has_video": True,
    },
    {
        "name": "The Art of Code: A Visual Programming Book",
        "blurb": "A beautifully illustrated guide that teaches programming through art, design thinking, and creative problem-solving.",
        "description": "This 300-page hardcover book teaches Python and creative coding through 50 stunning visual projects. From generative art to data visualization, learn to code while creating beautiful things.",
        "usd_goal": 12000, "duration_days": 30, "prep_days": 90,
        "main_category": "Publishing", "country": "GB", "has_video": False,
    },
    {
        "name": "SolarPack Pro: Foldable Solar Panel Kit",
        "blurb": "Ultra-efficient foldable solar panels that charge your devices 3x faster. Built for adventurers and off-grid living.",
        "description": "The SolarPack Pro uses monocrystalline cells with 24% efficiency in a lightweight, foldable design. Charge phones, laptops, and even portable power stations. Includes smart charge controller with MPPT.",
        "usd_goal": 35000, "duration_days": 45, "prep_days": 30,
        "main_category": "Technology", "country": "AU", "has_video": True,
    },
    {
        "name": "Pixel Legends: A Retro RPG Adventure",
        "blurb": "An epic 16-bit RPG with hand-drawn pixel art, orchestral soundtrack, and 60+ hours of story-driven gameplay.",
        "description": "Pixel Legends is a love letter to classic JRPGs. Explore a vast world of 8 kingdoms, recruit 12 unique characters, and battle through a branching storyline with multiple endings. Every sprite hand-crafted.",
        "usd_goal": 80000, "duration_days": 40, "prep_days": 120,
        "main_category": "Games", "country": "JP", "has_video": True,
    },
    {
        "name": "CloudNine Ergonomic Desk Chair",
        "blurb": "The ultimate work-from-home chair with adaptive lumbar support, breathable mesh, and 12-hour comfort guarantee.",
        "description": "CloudNine uses aerospace-grade aluminum and dynamic tension mesh that adapts to your body shape. Features adjustable armrests, headrest, and a patented pressure-distribution system for all-day comfort.",
        "usd_goal": 45000, "duration_days": 30, "prep_days": 60,
        "main_category": "Design", "country": "DE", "has_video": True,
    },
    {
        "name": "FreshHarvest: AI-Powered Indoor Garden",
        "blurb": "Grow organic herbs and vegetables year-round with our smart indoor garden that uses AI to optimize light, water, and nutrients.",
        "description": "FreshHarvest combines hydroponics with machine learning. The built-in AI monitors plant health via camera sensors, auto-adjusts LED spectrum, and sends you harvest alerts. Grow 30+ plant varieties.",
        "usd_goal": 18000, "duration_days": 30, "prep_days": 50,
        "main_category": "Food", "country": "NL", "has_video": True,
    },
    {
        "name": "Wanderlust: A Travel Photography Film",
        "blurb": "A breathtaking 90-minute documentary following 5 photographers across 20 countries capturing vanishing landscapes.",
        "description": "Wanderlust tells the story of Earth's most endangered natural wonders through the lenses of award-winning photographers. Shot in 8K across 3 continents over 18 months. Executive produced by National Geographic alumni.",
        "usd_goal": 120000, "duration_days": 60, "prep_days": 180,
        "main_category": "Film & Video", "country": "CA", "has_video": True,
    },
    {
        "name": "MindFlow: Meditation & Focus Headband",
        "blurb": "EEG-powered headband that provides real-time brain feedback to deepen meditation and sharpen focus in minutes.",
        "description": "MindFlow uses medical-grade EEG sensors to read your brainwaves and guide you into optimal flow states. Includes 200+ guided sessions, sleep tracking, and stress monitoring. Pairs with our iOS and Android app.",
        "usd_goal": 60000, "duration_days": 35, "prep_days": 90,
        "main_category": "Technology", "country": "US", "has_video": True,
    },
    {
        "name": "Heritage Coffee: Single-Origin Beans",
        "blurb": "Ethically sourced, small-batch roasted coffee from 6 rare origins. Subscription boxes that support farming communities.",
        "description": "Each Heritage Coffee box features beans from a single farm, roasted within 48 hours of shipping. We pay farmers 3x fair-trade prices and include origin stories, brewing guides, and flavor notes.",
        "usd_goal": 8000, "duration_days": 25, "prep_days": 30,
        "main_category": "Food", "country": "BR", "has_video": False,
    },
    {
        "name": "StreetCanvas: Urban Art Board Game",
        "blurb": "A strategic board game where players compete as street artists to claim territory, dodge authorities, and create masterpieces.",
        "description": "StreetCanvas combines area-control mechanics with artistic creativity. 2-6 players, 45-90 minute games. Features 120 unique art cards, custom wooden meeples, and a modular city board that changes every game.",
        "usd_goal": 20000, "duration_days": 30, "prep_days": 60,
        "main_category": "Games", "country": "US", "has_video": True,
    },
    {
        "name": "TinyHome Blueprint Collection",
        "blurb": "Professional architectural plans for 10 stunning tiny homes under 400 sq ft. Build your dream sustainable micro-home.",
        "description": "Each blueprint set includes detailed construction drawings, material lists, 3D renderings, and build guides. Designs range from modern minimalist to rustic cabin. All plans meet international building codes.",
        "usd_goal": 15000, "duration_days": 30, "prep_days": 45,
        "main_category": "Design", "country": "US", "has_video": False,
    },
    {
        "name": "Melodia: AI Music Composition App",
        "blurb": "Create professional music in any genre using AI. No musical knowledge needed — just describe the mood you want.",
        "description": "Melodia uses transformer models trained on 10 million songs to generate original compositions. Describe your vision in plain English, adjust tempo, instruments, and style, then export studio-quality tracks.",
        "usd_goal": 40000, "duration_days": 35, "prep_days": 60,
        "main_category": "Music", "country": "GB", "has_video": True,
    },
    {
        "name": "EcoThreads: Sustainable Fashion Line",
        "blurb": "Zero-waste clothing made from recycled ocean plastic and organic cotton. Fashion that fights climate change.",
        "description": "Every EcoThreads garment is made from 95% recycled materials. Our supply chain is carbon-negative. The collection includes everyday basics, activewear, and outerwear. Sizes XS-4XL.",
        "usd_goal": 30000, "duration_days": 30, "prep_days": 45,
        "main_category": "Fashion", "country": "SE", "has_video": True,
    },
    {
        "name": "LunaLamp: Magnetic Levitating Moon Light",
        "blurb": "A hyper-realistic 3D-printed moon that floats and rotates using magnetic levitation. 16 million color options.",
        "description": "LunaLamp uses NASA topographic data to recreate every crater and mountain on the lunar surface. The electromagnetic base levitates the moon 20mm in mid-air. Control colors and brightness via app.",
        "usd_goal": 22000, "duration_days": 30, "prep_days": 40,
        "main_category": "Design", "country": "HK", "has_video": True,
    },
    {
        "name": "CodeCraft Academy: Kids Learn to Code",
        "blurb": "Interactive coding kits for kids aged 6-12. Physical building blocks that teach programming logic through play.",
        "description": "CodeCraft Academy combines physical snap-together blocks with a tablet app. Kids build circuits, robots, and games while learning computational thinking. Curriculum developed with MIT educators.",
        "usd_goal": 55000, "duration_days": 40, "prep_days": 90,
        "main_category": "Technology", "country": "US", "has_video": True,
    },
    {
        "name": "Desert Bloom: A Graphic Novel Trilogy",
        "blurb": "A sci-fi graphic novel set in a post-water world. Three volumes of stunning hand-painted watercolor art and gripping storytelling.",
        "description": "Desert Bloom follows Mira, a water-diviner in 2187, as she discovers an underground ocean that could save humanity. Each 120-page volume features hand-painted watercolor illustrations on archival paper.",
        "usd_goal": 18000, "duration_days": 30, "prep_days": 120,
        "main_category": "Comics", "country": "FR", "has_video": False,
    },
    {
        "name": "PetPal: Smart Pet Health Monitor",
        "blurb": "A lightweight collar attachment that tracks your pet's vitals, activity, sleep, and detects early signs of illness.",
        "description": "PetPal uses medical-grade sensors to monitor heart rate, temperature, activity levels, and sleep patterns. The AI engine learns your pet's baseline and alerts you to anomalies. Works with dogs and cats.",
        "usd_goal": 35000, "duration_days": 30, "prep_days": 60,
        "main_category": "Technology", "country": "US", "has_video": True,
    },
    {
        "name": "Artisan Pottery Wheel: Desktop Edition",
        "blurb": "A compact, whisper-quiet electric pottery wheel designed for apartment living. Create studio-quality ceramics at home.",
        "description": "Our desktop pottery wheel features a brushless DC motor, variable speed control, and a splash-proof design perfect for small spaces. Includes a starter clay kit, tools, and 10 video tutorials.",
        "usd_goal": 16000, "duration_days": 30, "prep_days": 45,
        "main_category": "Crafts", "country": "JP", "has_video": True,
    },
    {
        "name": "StormChaser VR Experience",
        "blurb": "Experience the raw power of tornadoes, hurricanes, and lightning storms in breathtaking VR. Educational and thrilling.",
        "description": "StormChaser VR places you inside the world's most extreme weather events using photogrammetry and real storm data. Developed with NOAA meteorologists. Compatible with Meta Quest, PSVR2, and SteamVR.",
        "usd_goal": 70000, "duration_days": 45, "prep_days": 90,
        "main_category": "Games", "country": "US", "has_video": True,
    },
    {
        "name": "Nomad Kitchen: Collapsible Cookware Set",
        "blurb": "Full 12-piece cookware set that collapses flat for storage. Perfect for van life, camping, and tiny kitchens.",
        "description": "Nomad Kitchen uses food-grade silicone and titanium to create pots, pans, and utensils that collapse to just 2 inches tall. Dishwasher safe, oven safe to 450°F, and weighs under 3 lbs total.",
        "usd_goal": 28000, "duration_days": 30, "prep_days": 50,
        "main_category": "Design", "country": "NL", "has_video": True,
    },
    {
        "name": "Rhythm & Roots: World Music Festival Album",
        "blurb": "A double vinyl album featuring 20 tracks recorded live at festivals across Africa, South America, and Southeast Asia.",
        "description": "Over 2 years, we recorded 40+ artists at 12 festivals in 8 countries. This curated collection brings together traditional instruments, modern beats, and cross-cultural collaborations pressed on 180g vinyl.",
        "usd_goal": 10000, "duration_days": 25, "prep_days": 30,
        "main_category": "Music", "country": "ZA", "has_video": True,
    },
    {
        "name": "SafeStep: Smart Hiking Boots",
        "blurb": "GPS-enabled hiking boots with terrain-adaptive soles, built-in emergency beacon, and real-time trail mapping.",
        "description": "SafeStep boots feature a micro-GPS module, pressure-sensing insoles that adapt stiffness to terrain, and an SOS beacon that works without cell service. Waterproof, breathable, and rated for -20°C.",
        "usd_goal": 95000, "duration_days": 45, "prep_days": 120,
        "main_category": "Technology", "country": "CH", "has_video": True,
    },
    {
        "name": "Starlight Stories: Bedtime Story Projector",
        "blurb": "A magical ceiling projector that turns bedtime stories into immersive star-lit animations for children.",
        "description": "Starlight Stories projects animated constellations onto the ceiling while narrating original tales. 30 stories included, with new ones monthly. Built-in sleep timer, gentle night-light mode, and parent app.",
        "usd_goal": 20000, "duration_days": 30, "prep_days": 45,
        "main_category": "Design", "country": "DK", "has_video": True,
    },
    {
        "name": "Green Thumb: Community Garden Toolkit",
        "blurb": "Everything a neighborhood needs to start a community garden: raised beds, tools, seeds, and a planning app.",
        "description": "Green Thumb ships as a complete kit for starting a 500 sq ft community garden. Includes 6 cedar raised beds, professional tools, 50 seed varieties for your climate zone, and our garden management app.",
        "usd_goal": 14000, "duration_days": 30, "prep_days": 30,
        "main_category": "Food", "country": "US", "has_video": False,
    },
]

# ── Create campaigns, evaluate, and publish ──────────────────────
print(f"\n🚀 Seeding {len(CAMPAIGNS)} campaigns...")
created_count = 0

for i, camp in enumerate(CAMPAIGNS):
    cid = creator_ids[i % len(creator_ids)]
    camp["creator_id"] = cid

    # Create
    r = requests.post(f"{BASE}/campaigns", json=camp)
    if r.status_code != 201:
        print(f"  ❌ Create failed for '{camp['name'][:40]}': {r.text[:60]}")
        continue

    campaign = r.json()["campaign"]
    campaign_id = campaign["id"]

    # Evaluate (calls Gemini AI)
    print(f"  [{i+1}/{len(CAMPAIGNS)}] Evaluating: {camp['name'][:50]}...", end=" ", flush=True)
    r2 = requests.post(f"{BASE}/campaigns/{campaign_id}/evaluate")
    if r2.status_code == 200:
        score = r2.json().get("score", "?")
        print(f"Score: {score}", end=" ")
    else:
        print(f"eval-err({r2.status_code})", end=" ")

    # Publish
    r3 = requests.post(f"{BASE}/campaigns/{campaign_id}/publish")
    if r3.status_code == 200:
        print("✅ Published")
        created_count += 1
    else:
        print(f"pub-err({r3.status_code})")

    # Small delay to avoid rate-limiting Gemini
    time.sleep(1)

print(f"\n✅ Done! {created_count}/{len(CAMPAIGNS)} campaigns created and published.")

# Verify
r = requests.get(f"{BASE}/campaigns")
total = len(r.json().get("campaigns", []))
print(f"📊 Total public campaigns now: {total}")
