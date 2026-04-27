"""FundAI Complete API Test Script"""
import requests
import json

BASE = "http://localhost:5000/api"
results = []

def test(name, method, endpoint, data=None, expected_status=200):
    try:
        url = f"{BASE}{endpoint}"
        if method == "GET":
            r = requests.get(url, timeout=5)
        elif method == "POST":
            r = requests.post(url, json=data, timeout=5)
        elif method == "PUT":
            r = requests.put(url, json=data, timeout=5)
        elif method == "DELETE":
            r = requests.delete(url, timeout=5)
        
        status = "PASS" if r.status_code == expected_status else f"FAIL ({r.status_code})"
        results.append((name, status, r.status_code))
        
        if r.status_code < 400:
            return r.json()
        return None
    except Exception as e:
        results.append((name, f"ERROR: {str(e)[:30]}", 0))
        return None

print("=" * 50)
print("FundAI Complete API Test")
print("=" * 50)

# Auth & Basic endpoints
test("Health Check", "GET", "/health")
test("Get Categories", "GET", "/categories")
test("Get Countries", "GET", "/countries")

# Signup
user_data = test("Signup New User", "POST", "/auth/signup", {
    "email": "fulltest@test.com",
    "password": "test1234",
    "name": "Full Test User",
    "role": "creator"
}, 201)
user_id = user_data.get("user", {}).get("id", 1) if user_data else 1

# Login
test("Login", "POST", "/auth/login", {
    "email": "fulltest@test.com",
    "password": "test1234"
})

# Campaigns
test("Get All Campaigns", "GET", "/campaigns")
campaign_data = test("Create Campaign", "POST", "/campaigns", {
    "creator_id": user_id,
    "name": "Full Test Campaign",
    "blurb": "Complete API test campaign",
    "main_category": "Technology",
    "usd_goal": 10000,
    "duration_days": 30,
    "country": "US",
    "has_video": False
}, 201)
campaign_id = campaign_data.get("campaign", {}).get("id", 1) if campaign_data else 1

test("Get Campaign", "GET", f"/campaigns/{campaign_id}")
test("Get User Campaigns", "GET", f"/campaigns/user/{user_id}")

# Rewards
test("Create Reward", "POST", f"/campaigns/{campaign_id}/rewards", {
    "title": "Early Bird",
    "description": "Get early access",
    "min_amount": 25
}, 201)
test("Get Rewards", "GET", f"/campaigns/{campaign_id}/rewards")

# Updates
test("Create Update", "POST", f"/campaigns/{campaign_id}/updates", {
    "title": "First Update",
    "content": "Exciting progress!"
}, 201)
test("Get Updates", "GET", f"/campaigns/{campaign_id}/updates")

# Comments
test("Create Comment", "POST", f"/campaigns/{campaign_id}/comments", {
    "user_id": user_id,
    "content": "Great project!"
}, 201)
test("Get Comments", "GET", f"/campaigns/{campaign_id}/comments")

# FAQs
test("Create FAQ", "POST", f"/campaigns/{campaign_id}/faqs", {
    "question": "When will it ship?",
    "answer": "Q1 2025"
}, 201)
test("Get FAQs", "GET", f"/campaigns/{campaign_id}/faqs")

# Milestones
test("Create Milestone", "POST", f"/campaigns/{campaign_id}/milestones", {
    "title": "First Milestone",
    "target_amount": 2500
}, 201)
test("Get Milestones", "GET", f"/campaigns/{campaign_id}/milestones")

# Bookmarks
test("Toggle Bookmark", "POST", "/bookmarks", {
    "user_id": user_id,
    "campaign_id": campaign_id
})
test("Get Bookmarks", "GET", f"/user/{user_id}/bookmarks")

# Notifications
test("Get Notifications", "GET", f"/user/{user_id}/notifications")

# Dashboard
test("Get Dashboard", "GET", f"/user/{user_id}/dashboard")

# Messages
test("Send Message", "POST", "/messages", {
    "sender_id": user_id,
    "recipient_id": user_id,
    "subject": "Test Message",
    "content": "Hello!"
}, 201)
test("Get Messages", "GET", f"/user/{user_id}/messages")

# Categories & Similar
test("Get by Category", "GET", "/campaigns/category/Technology")
test("Get Similar", "GET", f"/campaigns/{campaign_id}/similar")

# Analytics
test("Get Analytics", "GET", f"/campaigns/{campaign_id}/analytics")
test("Get Detailed Analytics", "GET", f"/campaigns/{campaign_id}/analytics/detailed")

# Search
test("Search Campaigns", "GET", "/search?q=test")

# Admin
test("Admin Stats", "GET", "/admin/stats")
test("Admin Users", "GET", "/admin/users")
test("Admin Campaigns", "GET", "/admin/campaigns")

# Email Verification
test("Send Verification", "POST", "/auth/send-verification", {"email": "fulltest@test.com"})

# AI Evaluation
test("Evaluate Campaign", "POST", f"/campaigns/{campaign_id}/evaluate")

# Edit Campaign
test("Update Campaign", "PUT", f"/campaigns/{campaign_id}", {
    "name": "Updated Test Campaign",
    "blurb": "Updated blurb"
})

# Drafts
test("Get Drafts", "GET", f"/user/{user_id}/drafts")

# Print Results
print("\n" + "=" * 50)
print("TEST RESULTS")
print("=" * 50)
passed = sum(1 for r in results if r[1].startswith("✓"))
failed = len(results) - passed

for name, status, code in results:
    print(f"{status} {name}")

print(f"\n{passed}/{len(results)} tests passed ({failed} failed)")

if failed > 0:
    print("\nFailed tests:")
    for name, status, code in results:
        if not status.startswith("✓"):
            print(f"  - {name}: {status}")
