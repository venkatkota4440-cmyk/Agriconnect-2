#!/usr/bin/env python3
"""
Comprehensive backend API test for AgriLink 360 / Kisanbazarr
Tests all endpoints including Claude AI integration
"""

import requests
import json
import time
from typing import Dict, Any, Optional

# Base URL from .env
BASE_URL = "https://harvest-fair-trade.preview.emergentagent.com/api"

# Test data storage
test_data = {
    "farmer_token": None,
    "farmer_id": None,
    "buyer_token": None,
    "buyer_id": None,
    "listing_id": None,
    "offer_id": None,
    "alert_id": None,
    "conversation_id": None,
    "ai_session_id": None,
}

def log_test(name: str, passed: bool, details: str = ""):
    """Log test result"""
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"{status}: {name}")
    if details:
        print(f"   Details: {details}")
    if not passed:
        print()

def test_api(method: str, endpoint: str, token: Optional[str] = None, 
             json_data: Optional[Dict] = None, expected_status: int = 200) -> tuple:
    """Make API request and return (success, response_data)"""
    url = f"{BASE_URL}{endpoint}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    try:
        if method == "GET":
            resp = requests.get(url, headers=headers, timeout=30)
        elif method == "POST":
            resp = requests.post(url, headers=headers, json=json_data, timeout=30)
        elif method == "PUT":
            resp = requests.put(url, headers=headers, json=json_data, timeout=30)
        elif method == "DELETE":
            resp = requests.delete(url, headers=headers, timeout=30)
        else:
            return False, {"error": "Invalid method"}
        
        success = resp.status_code == expected_status
        try:
            data = resp.json()
        except:
            data = {"text": resp.text, "status": resp.status_code}
        
        return success, data
    except Exception as e:
        return False, {"error": str(e)}

print("=" * 80)
print("AgriLink 360 Backend API Test Suite")
print("=" * 80)
print()

# ============================================================================
# 1. SEED DATA
# ============================================================================
print("1. TESTING SEED ENDPOINT")
print("-" * 80)

success, data = test_api("POST", "/seed")
log_test("POST /api/seed returns {ok:true}", success and data.get("ok") == True, 
         f"Response: {data}")

# Verify seed worked - check meta
success, data = test_api("GET", "/market-prices/meta")
has_data = (success and 
            len(data.get("crops", [])) > 0 and 
            len(data.get("states", [])) > 0 and 
            len(data.get("markets", [])) > 0 and 
            len(data.get("categories", [])) > 0)
log_test("GET /api/market-prices/meta returns non-empty data after seed", has_data,
         f"Crops: {len(data.get('crops', []))}, States: {len(data.get('states', []))}, Markets: {len(data.get('markets', []))}")

print()

# ============================================================================
# 2. AUTH - REGISTER
# ============================================================================
print("2. TESTING AUTH - REGISTER")
print("-" * 80)

# Register farmer
farmer_email = f"test.farmer.{int(time.time())}@agrilink.test"
farmer_data = {
    "name": "Rajesh Kumar",
    "email": farmer_email,
    "password": "farmer123",
    "role": "farmer",
    "phone": "+91-9876543210",
    "crops": ["Tomato", "Wheat"],
    "location": {"lat": 28.61, "lng": 77.23, "label": "Delhi NCR"}
}
success, data = test_api("POST", "/auth/register", json_data=farmer_data)
farmer_registered = success and "token" in data and data.get("user", {}).get("role") == "farmer"
if farmer_registered:
    test_data["farmer_token"] = data["token"]
    test_data["farmer_id"] = data["user"]["id"]
log_test("POST /api/auth/register (farmer) returns token and user with role=farmer", 
         farmer_registered, f"User ID: {test_data.get('farmer_id')}")

# Register buyer
buyer_email = f"test.buyer.{int(time.time())}@agrilink.test"
buyer_data = {
    "name": "FreshMart Retail",
    "email": buyer_email,
    "password": "buyer123",
    "role": "buyer",
    "buyerType": "Retail",
    "phone": "+91-9876543211",
    "location": {"lat": 28.65, "lng": 77.30, "label": "Noida"}
}
success, data = test_api("POST", "/auth/register", json_data=buyer_data)
buyer_registered = success and "token" in data and data.get("user", {}).get("role") == "buyer"
if buyer_registered:
    test_data["buyer_token"] = data["token"]
    test_data["buyer_id"] = data["user"]["id"]
log_test("POST /api/auth/register (buyer) returns token and user with role=buyer", 
         buyer_registered, f"User ID: {test_data.get('buyer_id')}")

# Test duplicate email
success, data = test_api("POST", "/auth/register", json_data=farmer_data, expected_status=409)
log_test("POST /api/auth/register with duplicate email returns 409", 
         success and data.get("error"), f"Error: {data.get('error')}")

print()

# ============================================================================
# 3. AUTH - LOGIN
# ============================================================================
print("3. TESTING AUTH - LOGIN")
print("-" * 80)

# Login with sample buyer
sample_buyer_login = {
    "email": "freshmart.retail@sample.agrilink",
    "password": "sample123"
}
success, data = test_api("POST", "/auth/login", json_data=sample_buyer_login)
sample_login_ok = success and "token" in data and "user" in data
log_test("POST /api/auth/login with sample buyer credentials returns token+user", 
         sample_login_ok, f"User: {data.get('user', {}).get('name')}")

print()

# ============================================================================
# 4. AUTH - ME, PROFILE, LOGOUT
# ============================================================================
print("4. TESTING AUTH - ME, PROFILE, LOGOUT")
print("-" * 80)

# Test /auth/me with token
success, data = test_api("GET", "/auth/me", token=test_data["farmer_token"])
log_test("GET /api/auth/me with Bearer token returns user", 
         success and "user" in data, f"User: {data.get('user', {}).get('name')}")

# Test /auth/me without token
success, data = test_api("GET", "/auth/me", expected_status=401)
log_test("GET /api/auth/me without token returns 401", 
         success and data.get("error"), f"Error: {data.get('error')}")

# Test profile update
profile_update = {"phone": "+91-9999999999", "crops": ["Tomato", "Onion", "Wheat"]}
success, data = test_api("PUT", "/auth/profile", token=test_data["farmer_token"], json_data=profile_update)
profile_updated = success and data.get("user", {}).get("phone") == profile_update["phone"]
log_test("PUT /api/auth/profile updates fields", 
         profile_updated, f"Updated phone: {data.get('user', {}).get('phone')}")

# Test logout
success, data = test_api("POST", "/auth/logout", token=test_data["farmer_token"])
log_test("POST /api/auth/logout returns {ok:true}", 
         success and data.get("ok") == True)

# Verify token is invalid after logout
success, data = test_api("GET", "/auth/me", token=test_data["farmer_token"], expected_status=401)
log_test("GET /api/auth/me with logged-out token returns 401", 
         success and data.get("error"))

# Re-register farmer for subsequent tests
success, data = test_api("POST", "/auth/login", json_data={"email": farmer_email, "password": "farmer123"})
if success and "token" in data:
    test_data["farmer_token"] = data["token"]

print()

# ============================================================================
# 5. MARKET PRICES
# ============================================================================
print("5. TESTING MARKET PRICES")
print("-" * 80)

# Test market prices list with filter
success, data = test_api("GET", "/market-prices?crop=Tomato")
prices_ok = success and isinstance(data.get("prices"), list) and len(data["prices"]) > 0
if prices_ok:
    price = data["prices"][0]
    has_fields = all(k in price for k in ["crop", "market", "minPrice", "avgPrice", "maxPrice"])
    log_test("GET /api/market-prices?crop=Tomato returns array with min/avg/max", 
             has_fields, f"Found {len(data['prices'])} prices")
else:
    log_test("GET /api/market-prices?crop=Tomato returns array", False, f"Response: {data}")

# Test trend
success, data = test_api("GET", "/market-prices/trend?crop=Tomato")
trend_ok = (success and 
            isinstance(data.get("series"), list) and 
            len(data["series"]) > 0 and
            isinstance(data.get("markets"), list) and
            "best" in data)
if trend_ok:
    series_entry = data["series"][0]
    has_date_avg = "date" in series_entry and "Average" in series_entry
    log_test("GET /api/market-prices/trend?crop=Tomato returns series with date+Average", 
             has_date_avg, f"Series length: {len(data['series'])}, Markets: {len(data['markets'])}")
else:
    log_test("GET /api/market-prices/trend?crop=Tomato", False, f"Response: {data}")

# Test best-market calculator
best_market_req = {
    "crop": "Tomato",
    "quantity": 500,
    "lat": 28.61,
    "lng": 77.23,
    "maxDistance": 400
}
success, data = test_api("POST", "/best-market", json_data=best_market_req)
best_market_ok = (success and 
                  isinstance(data.get("options"), list) and 
                  len(data["options"]) > 0 and
                  "best" in data)
if best_market_ok:
    option = data["options"][0]
    has_fields = all(k in option for k in ["gross", "transport", "net", "distance"])
    sorted_ok = all(data["options"][i]["net"] >= data["options"][i+1]["net"] 
                    for i in range(len(data["options"])-1))
    log_test("POST /api/best-market returns options with gross/transport/net/distance, sorted by net desc", 
             has_fields and sorted_ok, f"Found {len(data['options'])} options, best net: {data['best']['net']}")
else:
    log_test("POST /api/best-market", False, f"Response: {data}")

print()

# ============================================================================
# 6. LISTINGS
# ============================================================================
print("6. TESTING LISTINGS")
print("-" * 80)

# Get listings (should have seeded ones)
success, data = test_api("GET", "/listings")
listings_ok = success and isinstance(data.get("listings"), list) and len(data["listings"]) > 0
log_test("GET /api/listings returns active listings (seeded)", 
         listings_ok, f"Found {len(data.get('listings', []))} listings")

# Get listings with location (should have distance and be sorted)
success, data = test_api("GET", "/listings?lat=28.61&lng=77.23")
if success and len(data.get("listings", [])) > 0:
    listing = data["listings"][0]
    has_distance = "distance" in listing and isinstance(listing["distance"], (int, float))
    sorted_ok = all(data["listings"][i].get("distance", 0) <= data["listings"][i+1].get("distance", 999999) 
                    for i in range(len(data["listings"])-1))
    log_test("GET /api/listings?lat=&lng= returns listings with distance, sorted by distance", 
             has_distance and sorted_ok, f"First distance: {listing.get('distance')} km")
else:
    log_test("GET /api/listings?lat=&lng=", False, "No listings returned")

# Create listing without auth (should fail)
listing_data = {
    "crop": "Tomato",
    "quantity": 100,
    "expectedPrice": 30,
    "minPrice": 25,
    "unit": "kg",
    "quality": "Grade A",
    "location": {"lat": 28.61, "lng": 77.23, "label": "Test Farm"}
}
success, data = test_api("POST", "/listings", json_data=listing_data, expected_status=401)
log_test("POST /api/listings without auth returns 401", 
         success and data.get("error"))

# Create listing as farmer
success, data = test_api("POST", "/listings", token=test_data["farmer_token"], json_data=listing_data)
listing_created = success and "listing" in data and data["listing"].get("crop") == "Tomato"
if listing_created:
    test_data["listing_id"] = data["listing"]["id"]
log_test("POST /api/listings (as farmer with Bearer) creates listing", 
         listing_created, f"Listing ID: {test_data.get('listing_id')}")

# Get my listings
success, data = test_api("GET", "/listings/mine", token=test_data["farmer_token"])
mine_ok = success and isinstance(data.get("listings"), list)
if mine_ok:
    has_new = any(l["id"] == test_data["listing_id"] for l in data["listings"])
    log_test("GET /api/listings/mine (farmer Bearer) includes new listing", 
             has_new, f"Found {len(data['listings'])} listings")
else:
    log_test("GET /api/listings/mine", False, f"Response: {data}")

print()

# ============================================================================
# 7. NEARBY
# ============================================================================
print("7. TESTING NEARBY")
print("-" * 80)

# Test nearby buyers
success, data = test_api("GET", "/nearby?lat=28.61&lng=77.23&type=buyers&radius=500")
nearby_ok = success and isinstance(data.get("results"), list)
if nearby_ok and len(data["results"]) > 0:
    result = data["results"][0]
    has_fields = "distance" in result and "matchScore" in result
    sorted_ok = all(data["results"][i].get("matchScore", 0) >= data["results"][i+1].get("matchScore", 0) 
                    for i in range(len(data["results"])-1) if data["results"][i].get("matchScore") != data["results"][i+1].get("matchScore"))
    log_test("GET /api/nearby?type=buyers returns results with distance+matchScore, sorted", 
             has_fields and sorted_ok, f"Found {len(data['results'])} buyers")
else:
    log_test("GET /api/nearby?type=buyers", nearby_ok, f"Found {len(data.get('results', []))} results")

# Test nearby markets
success, data = test_api("GET", "/nearby?lat=28.61&lng=77.23&type=markets&radius=500")
markets_ok = success and isinstance(data.get("results"), list)
if markets_ok and len(data["results"]) > 0:
    has_distance = "distance" in data["results"][0]
    log_test("GET /api/nearby?type=markets returns results with distance", 
             has_distance, f"Found {len(data['results'])} markets")
else:
    log_test("GET /api/nearby?type=markets", markets_ok, f"Found {len(data.get('results', []))} results")

# Test nearby transport
success, data = test_api("GET", "/nearby?lat=28.61&lng=77.23&type=transport&radius=500")
transport_ok = success and isinstance(data.get("results"), list)
if transport_ok and len(data["results"]) > 0:
    has_distance = "distance" in data["results"][0]
    log_test("GET /api/nearby?type=transport returns results with distance", 
             has_distance, f"Found {len(data['results'])} transport")
else:
    log_test("GET /api/nearby?type=transport", transport_ok, f"Found {len(data.get('results', []))} results")

# Test missing lat/lng
success, data = test_api("GET", "/nearby?type=buyers", expected_status=400)
log_test("GET /api/nearby without lat/lng returns 400", 
         success and data.get("error"))

print()

# ============================================================================
# 8. OFFERS WORKFLOW
# ============================================================================
print("8. TESTING OFFERS WORKFLOW")
print("-" * 80)

# Create offer as buyer on farmer's listing
offer_data = {
    "listingId": test_data["listing_id"],
    "quantity": 50,
    "price": 28,
    "message": "Interested in your tomatoes. Can we negotiate?"
}
success, data = test_api("POST", "/offers", token=test_data["buyer_token"], json_data=offer_data)
offer_created = success and "offer" in data and data["offer"].get("status") == "pending"
if offer_created:
    test_data["offer_id"] = data["offer"]["id"]
log_test("POST /api/offers (as buyer) creates offer with status=pending", 
         offer_created, f"Offer ID: {test_data.get('offer_id')}")

# Check farmer has notification
time.sleep(1)  # Give notification time to be created
success, data = test_api("GET", "/notifications", token=test_data["farmer_token"])
notif_ok = success and data.get("unread", 0) >= 1
if notif_ok:
    has_offer_notif = any(n.get("type") == "offer" for n in data.get("notifications", []))
    log_test("Farmer receives notification after offer (GET /api/notifications shows unread>=1 with type='offer')", 
             has_offer_notif, f"Unread: {data.get('unread')}")
else:
    log_test("Farmer receives notification", False, f"Unread: {data.get('unread', 0)}")

# Get offers as buyer (sent)
success, data = test_api("GET", "/offers", token=test_data["buyer_token"])
buyer_offers_ok = success and isinstance(data.get("sent"), list)
if buyer_offers_ok:
    has_offer = any(o["id"] == test_data["offer_id"] for o in data["sent"])
    log_test("GET /api/offers (as buyer) sent includes the offer", 
             has_offer, f"Sent: {len(data['sent'])}")
else:
    log_test("GET /api/offers (as buyer)", False, f"Response: {data}")

# Get offers as farmer (received)
success, data = test_api("GET", "/offers", token=test_data["farmer_token"])
farmer_offers_ok = success and isinstance(data.get("received"), list)
if farmer_offers_ok:
    has_offer = any(o["id"] == test_data["offer_id"] for o in data["received"])
    log_test("GET /api/offers (as farmer) received includes the offer", 
             has_offer, f"Received: {len(data['received'])}")
else:
    log_test("GET /api/offers (as farmer)", False, f"Response: {data}")

# Farmer counters the offer
counter_data = {"status": "countered", "counterPrice": 29}
success, data = test_api("PUT", f"/offers/{test_data['offer_id']}", 
                        token=test_data["farmer_token"], json_data=counter_data)
counter_ok = success and data.get("offer", {}).get("status") == "countered" and data["offer"].get("price") == 29
log_test("PUT /api/offers/:id (farmer) with status=countered updates price", 
         counter_ok, f"New price: {data.get('offer', {}).get('price')}")

# Farmer accepts the offer
accept_data = {"status": "accepted"}
success, data = test_api("PUT", f"/offers/{test_data['offer_id']}", 
                        token=test_data["farmer_token"], json_data=accept_data)
accept_ok = success and data.get("offer", {}).get("status") == "accepted"
log_test("PUT /api/offers/:id (farmer) with status=accepted updates status", 
         accept_ok, f"Status: {data.get('offer', {}).get('status')}")

# Farmer completes the offer
complete_data = {"status": "completed"}
success, data = test_api("PUT", f"/offers/{test_data['offer_id']}", 
                        token=test_data["farmer_token"], json_data=complete_data)
complete_ok = success and data.get("offer", {}).get("status") == "completed"
log_test("PUT /api/offers/:id (farmer) with status=completed updates status", 
         complete_ok, f"Status: {data.get('offer', {}).get('status')}")

# Verify listing is now sold
success, data = test_api("GET", f"/listings/{test_data['listing_id']}")
listing_sold = success and data.get("listing", {}).get("status") == "sold"
log_test("After offer completed, listing status becomes 'sold'", 
         listing_sold, f"Listing status: {data.get('listing', {}).get('status')}")

# Verify completedTx incremented
success, data = test_api("GET", "/auth/me", token=test_data["farmer_token"])
farmer_tx = data.get("user", {}).get("completedTx", 0)
success2, data2 = test_api("GET", "/auth/me", token=test_data["buyer_token"])
buyer_tx = data2.get("user", {}).get("completedTx", 0)
log_test("After offer completed, both farmer and buyer completedTx incremented", 
         farmer_tx > 0 and buyer_tx > 0, f"Farmer: {farmer_tx}, Buyer: {buyer_tx}")

print()

# ============================================================================
# 9. NOTIFICATIONS
# ============================================================================
print("9. TESTING NOTIFICATIONS")
print("-" * 80)

# Get notifications
success, data = test_api("GET", "/notifications", token=test_data["farmer_token"])
notif_ok = success and "notifications" in data and "unread" in data
log_test("GET /api/notifications returns {notifications, unread}", 
         notif_ok, f"Total: {len(data.get('notifications', []))}, Unread: {data.get('unread', 0)}")

# Mark all as read
success, data = test_api("PUT", "/notifications/read", token=test_data["farmer_token"])
log_test("PUT /api/notifications/read returns {ok:true}", 
         success and data.get("ok") == True)

# Verify unread is now 0
success, data = test_api("GET", "/notifications", token=test_data["farmer_token"])
unread_zero = success and data.get("unread") == 0
log_test("After marking read, unread becomes 0", 
         unread_zero, f"Unread: {data.get('unread')}")

print()

# ============================================================================
# 10. PRICE ALERTS
# ============================================================================
print("10. TESTING PRICE ALERTS")
print("-" * 80)

# Create price alert
alert_data = {
    "crop": "Tomato",
    "targetPrice": 30,
    "direction": "above"
}
success, data = test_api("POST", "/price-alerts", token=test_data["farmer_token"], json_data=alert_data)
alert_created = success and "alert" in data
if alert_created:
    test_data["alert_id"] = data["alert"]["id"]
log_test("POST /api/price-alerts creates alert", 
         alert_created, f"Alert ID: {test_data.get('alert_id')}")

# Get price alerts
success, data = test_api("GET", "/price-alerts", token=test_data["farmer_token"])
alerts_ok = success and isinstance(data.get("alerts"), list)
if alerts_ok:
    has_alert = any(a["id"] == test_data["alert_id"] for a in data["alerts"])
    log_test("GET /api/price-alerts includes created alert", 
             has_alert, f"Found {len(data['alerts'])} alerts")
else:
    log_test("GET /api/price-alerts", False, f"Response: {data}")

# Delete price alert
success, data = test_api("DELETE", f"/price-alerts/{test_data['alert_id']}", token=test_data["farmer_token"])
log_test("DELETE /api/price-alerts/:id returns {ok:true}", 
         success and data.get("ok") == True)

print()

# ============================================================================
# 11. MESSAGES
# ============================================================================
print("11. TESTING MESSAGES")
print("-" * 80)

# Send message from buyer to farmer
message_data = {
    "to": test_data["farmer_id"],
    "text": "Hi, I'm interested in your produce. Can we discuss pricing?",
    "listingId": test_data["listing_id"]
}
success, data = test_api("POST", "/messages", token=test_data["buyer_token"], json_data=message_data)
message_sent = success and "message" in data
if message_sent:
    test_data["conversation_id"] = data["message"]["conversationId"]
log_test("POST /api/messages (as buyer) creates message", 
         message_sent, f"Conversation ID: {test_data.get('conversation_id')}")

# Get conversations
success, data = test_api("GET", "/conversations", token=test_data["buyer_token"])
conv_ok = success and isinstance(data.get("conversations"), list)
if conv_ok:
    has_conv = any(c["id"] == test_data["conversation_id"] for c in data["conversations"])
    log_test("GET /api/conversations (buyer) includes the conversation", 
             has_conv, f"Found {len(data['conversations'])} conversations")
else:
    log_test("GET /api/conversations", False, f"Response: {data}")

# Get messages in conversation
success, data = test_api("GET", f"/messages?conversationId={test_data['conversation_id']}", 
                        token=test_data["buyer_token"])
messages_ok = success and isinstance(data.get("messages"), list) and len(data["messages"]) > 0
log_test("GET /api/messages?conversationId= returns messages", 
         messages_ok, f"Found {len(data.get('messages', []))} messages")

print()

# ============================================================================
# 12. DEMAND, TRANSPORT, ANALYTICS
# ============================================================================
print("12. TESTING DEMAND, TRANSPORT, ANALYTICS")
print("-" * 80)

# Get demand
success, data = test_api("GET", "/demand")
demand_ok = success and isinstance(data.get("demand"), list)
log_test("GET /api/demand returns demand array", 
         demand_ok, f"Found {len(data.get('demand', []))} demand entries")

# Get transport with location
success, data = test_api("GET", "/transport?lat=28.61&lng=77.23")
transport_ok = success and isinstance(data.get("transport"), list)
if transport_ok and len(data["transport"]) > 0:
    has_distance = "distance" in data["transport"][0]
    log_test("GET /api/transport?lat=&lng= returns transport list with distance", 
             has_distance, f"Found {len(data['transport'])} transport")
else:
    log_test("GET /api/transport", transport_ok, f"Found {len(data.get('transport', []))} transport")

# Get analytics
success, data = test_api("GET", "/analytics")
analytics_ok = success and "stats" in data and "topCrops" in data
if analytics_ok:
    stats = data["stats"]
    has_stats = all(k in stats for k in ["farmers", "buyers", "listings", "transactions", "markets", "alerts"])
    log_test("GET /api/analytics returns {stats:{farmers,buyers,listings,transactions,markets,alerts}, topCrops[]}", 
             has_stats, f"Stats: {stats}")
else:
    log_test("GET /api/analytics", False, f"Response: {data}")

print()

# ============================================================================
# 13. CLAUDE AI CHAT (CRITICAL - REAL INTEGRATION)
# ============================================================================
print("13. TESTING CLAUDE AI CHAT (CRITICAL - REAL INTEGRATION)")
print("-" * 80)

# First turn
chat_data = {
    "message": "How often should I irrigate tomatoes?",
    "language": "English"
}
success, data = test_api("POST", "/ai/chat", json_data=chat_data)
chat_ok = success and "sessionId" in data and "answer" in data and len(data.get("answer", "")) > 0
if chat_ok:
    test_data["ai_session_id"] = data["sessionId"]
    answer = data["answer"]
    is_real = len(answer) > 50 and not any(x in answer.lower() for x in ["busy", "error", "failed"])
    log_test("POST /api/ai/chat returns {sessionId, answer} with real content (not error/fallback)", 
             is_real, f"Answer length: {len(answer)} chars, SessionId: {test_data['ai_session_id']}")
    if not is_real:
        print(f"   WARNING: Answer might be fallback: {answer[:100]}")
else:
    log_test("POST /api/ai/chat", False, f"Response: {data}")

# Multi-turn (reuse sessionId)
if test_data["ai_session_id"]:
    chat_data2 = {
        "sessionId": test_data["ai_session_id"],
        "message": "My soil is sandy, adjust that advice",
        "language": "English"
    }
    success, data = test_api("POST", "/ai/chat", json_data=chat_data2)
    multi_turn_ok = success and data.get("sessionId") == test_data["ai_session_id"] and len(data.get("answer", "")) > 0
    if multi_turn_ok:
        answer2 = data["answer"]
        references_context = any(x in answer2.lower() for x in ["sandy", "soil", "tomato", "irrigat"])
        log_test("POST /api/ai/chat multi-turn (same sessionId) returns answer referencing prior context", 
                 references_context, f"Answer mentions context: {references_context}")
        if not references_context:
            print(f"   WARNING: Answer might not reference context: {answer2[:100]}")
    else:
        log_test("POST /api/ai/chat multi-turn", False, f"Response: {data}")

# Test Hindi language
chat_hindi = {
    "message": "टमाटर की खेती के लिए सबसे अच्छा मौसम कौन सा है?",
    "language": "Hindi"
}
success, data = test_api("POST", "/ai/chat", json_data=chat_hindi)
hindi_ok = success and "answer" in data and len(data.get("answer", "")) > 0
if hindi_ok:
    answer_hindi = data["answer"]
    # Check if answer contains Devanagari script (Hindi)
    has_hindi = any('\u0900' <= c <= '\u097F' for c in answer_hindi)
    log_test("POST /api/ai/chat with language=Hindi returns answer in Hindi script", 
             has_hindi, f"Contains Hindi: {has_hindi}, Length: {len(answer_hindi)}")
    if not has_hindi:
        print(f"   WARNING: Answer not in Hindi: {answer_hindi[:100]}")
else:
    log_test("POST /api/ai/chat (Hindi)", False, f"Response: {data}")

print()

# ============================================================================
# 14. CLAUDE TRANSLATION (CRITICAL - REAL INTEGRATION)
# ============================================================================
print("14. TESTING CLAUDE TRANSLATION (CRITICAL - REAL INTEGRATION)")
print("-" * 80)

# Test translate-bulk to Hindi
bulk_strings = {
    "login": "Login",
    "register": "Register",
    "hero_title": "Sell Smarter",
    "welcome": "Welcome to AgriLink"
}
translate_bulk_data = {
    "strings": bulk_strings,
    "language": "Hindi"
}
success, data = test_api("POST", "/translate-bulk", json_data=translate_bulk_data)
bulk_ok = success and "translations" in data
if bulk_ok:
    translations = data["translations"]
    same_keys = set(translations.keys()) == set(bulk_strings.keys())
    has_hindi = any(any('\u0900' <= c <= '\u097F' for c in v) for v in translations.values())
    different_values = translations != bulk_strings
    log_test("POST /api/translate-bulk (Hindi) returns same KEYS with Hindi values (non-English)", 
             same_keys and has_hindi and different_values, 
             f"Keys match: {same_keys}, Has Hindi: {has_hindi}, Translations: {translations}")
    if not has_hindi:
        print(f"   WARNING: Translations not in Hindi: {translations}")
else:
    log_test("POST /api/translate-bulk (Hindi)", False, f"Response: {data}")

# Test translate-bulk to English (should short-circuit)
translate_english_data = {
    "strings": bulk_strings,
    "language": "English"
}
success, data = test_api("POST", "/translate-bulk", json_data=translate_english_data)
english_ok = success and data.get("translations") == bulk_strings
log_test("POST /api/translate-bulk (English) returns same strings (short-circuit)", 
         english_ok, f"Same: {data.get('translations') == bulk_strings}")

# Test translate single text to Telugu
translate_data = {
    "text": "Welcome {name}",
    "targetLanguage": "Telugu"
}
success, data = test_api("POST", "/translate", json_data=translate_data)
translate_ok = success and "translation" in data and len(data.get("translation", "")) > 0
if translate_ok:
    translation = data["translation"]
    has_telugu = any('\u0C00' <= c <= '\u0C7F' for c in translation)
    preserves_placeholder = "{name}" in translation
    log_test("POST /api/translate (Telugu) returns translation preserving {name} placeholder", 
             has_telugu and preserves_placeholder, 
             f"Has Telugu: {has_telugu}, Preserves placeholder: {preserves_placeholder}, Translation: {translation}")
    if not has_telugu:
        print(f"   WARNING: Translation not in Telugu: {translation}")
else:
    log_test("POST /api/translate (Telugu)", False, f"Response: {data}")

print()

# ============================================================================
# 15. ERROR HANDLING & EDGE CASES
# ============================================================================
print("15. TESTING ERROR HANDLING")
print("-" * 80)

# Test 500 errors have 'detail' field (simulate by invalid data)
# Most endpoints handle errors gracefully, but let's verify error structure
success, data = test_api("GET", "/market-prices/trend")  # Missing required 'crop' param
error_has_detail = not success and "error" in data
log_test("Error responses contain 'error' field", 
         error_has_detail, f"Error: {data.get('error')}")

# Verify no MongoDB ObjectId in responses (all should be UUID 'id')
success, data = test_api("GET", "/listings")
if success and len(data.get("listings", [])) > 0:
    listing = data["listings"][0]
    has_id = "id" in listing
    no_underscore_id = "_id" not in listing
    log_test("Responses use UUID 'id' (no MongoDB ObjectId '_id' leak)", 
             has_id and no_underscore_id, f"Has 'id': {has_id}, No '_id': {no_underscore_id}")
else:
    log_test("Check for ObjectId leak", False, "No listings to check")

print()

# ============================================================================
# SUMMARY
# ============================================================================
print("=" * 80)
print("TEST SUITE COMPLETE")
print("=" * 80)
print()
print("All critical endpoints tested including:")
print("✓ Seed data")
print("✓ Auth (register, login, me, logout, profile)")
print("✓ Market prices (list, meta, trend, best-market)")
print("✓ Listings (list, create, mine, distance sorting)")
print("✓ Nearby (buyers, markets, transport with distance)")
print("✓ Offers workflow (create, counter, accept, complete)")
print("✓ Notifications")
print("✓ Price alerts")
print("✓ Messages & conversations")
print("✓ Demand, Transport, Analytics")
print("✓ Claude AI chat (multi-turn, Hindi)")
print("✓ Claude translation (bulk, single, Telugu)")
print()
print("Review the output above for any ❌ FAIL markers.")
print("=" * 80)
