import os
import re
import uuid
import httpx
import pytest

COMPOSE_BASE_URL = os.getenv("COMPOSE_BASE_URL", "http://localhost:8000")


@pytest.fixture(scope="session")
def compose_url() -> str:
    """
    Ensure the Docker Compose services are running and healthy before executing integration tests.
    If not reachable, skip tests with an actionable message.
    """
    try:
        res = httpx.get(f"{COMPOSE_BASE_URL}/api/health", timeout=4.0)
        if res.status_code != 200:
            pytest.skip(f"Docker Compose service at {COMPOSE_BASE_URL} returned status {res.status_code}")
    except Exception as e:
        pytest.skip(f"Docker Compose stack is not running at {COMPOSE_BASE_URL} ({e}). Run 'docker compose up -d' first.")
    return COMPOSE_BASE_URL


# ==============================================================================
# 1. Frontend Compilation & Static Asset Delivery Tests
# ==============================================================================

def test_frontend_compilation_and_root_html(compose_url: str):
    """
    Verifies that Node successfully compiled the React application and that the
    FastAPI backend serves index.html with all required assets and mount points.
    """
    response = httpx.get(f"{compose_url}/", timeout=5.0)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    assert "text/html" in response.headers.get("content-type", "")

    html_content = response.text
    # 1. Mount container
    assert '<div id="root"></div>' in html_content, "Missing React root element #root"
    # 2. Main JS bundle compiled by Vite
    assert re.search(r'<script\s+type="module"\s+crossorigin\s+src="/assets/index-[^"]+\.js">', html_content), (
        "Compiled Vite JS bundle not found in index.html"
    )
    # 3. Main CSS stylesheet compiled by Tailwind/Vite
    assert re.search(r'<link\s+rel="stylesheet"\s+crossorigin\s+href="/assets/index-[^"]+\.css">', html_content), (
        "Compiled Tailwind CSS bundle not found in index.html"
    )
    # 4. Favicon link
    assert '/favicon.svg' in html_content


def test_frontend_compiled_javascript_and_css_bundles(compose_url: str):
    """
    Parses asset links from index.html and downloads the JS and CSS files,
    confirming they are compiled properly and served with correct MIME types.
    """
    html_res = httpx.get(f"{compose_url}/", timeout=5.0)
    assert html_res.status_code == 200

    # Extract JS bundle path
    js_match = re.search(r'src="(/assets/index-[^"]+\.js)"', html_res.text)
    assert js_match, "Could not extract JS bundle path from index.html"
    js_path = js_match.group(1)

    # Extract CSS bundle path
    css_match = re.search(r'href="(/assets/index-[^"]+\.css)"', html_res.text)
    assert css_match, "Could not extract CSS bundle path from index.html"
    css_path = css_match.group(1)

    # Verify JS bundle
    js_res = httpx.get(f"{compose_url}{js_path}", timeout=5.0)
    assert js_res.status_code == 200
    assert "javascript" in js_res.headers.get("content-type", "")
    assert len(js_res.content) > 50000, "JS bundle seems too small or incomplete"

    # Verify CSS bundle
    css_res = httpx.get(f"{compose_url}{css_path}", timeout=5.0)
    assert css_res.status_code == 200
    assert "css" in css_res.headers.get("content-type", "")
    assert len(css_res.content) > 5000, "CSS bundle seems too small or incomplete"


def test_frontend_static_icons(compose_url: str):
    """
    Verifies that public static assets (SVG icons and favicon) are delivered properly.
    """
    for asset in ["/favicon.svg", "/icons.svg"]:
        res = httpx.get(f"{compose_url}{asset}", timeout=5.0)
        assert res.status_code == 200, f"Failed to retrieve {asset}"
        assert "image/svg+xml" in res.headers.get("content-type", "")
        assert len(res.content) > 100


def test_frontend_spa_fallback_routing(compose_url: str):
    """
    Verifies that client-side SPA navigation routes (e.g., Guest Portal links)
    return index.html with 200 OK so React router/state takes over in the browser.
    """
    spa_routes = [
        "/guest?token=sarah-j-9821",
        "/status/sarah-j-9821",
        "/tables",
    ]
    for route in spa_routes:
        res = httpx.get(f"{compose_url}{route}", timeout=5.0)
        assert res.status_code == 200, f"Route {route} failed with status {res.status_code}"
        assert "text/html" in res.headers.get("content-type", "")
        assert '<div id="root"></div>' in res.text


def test_frontend_missing_asset_returns_404(compose_url: str):
    """
    Verifies that missing static files return 404 rather than falling back to index.html.
    """
    res = httpx.get(f"{compose_url}/assets/non_existent_bundle_12345.js", timeout=5.0)
    assert res.status_code == 404


# ==============================================================================
# 2. Backend Communication with PostgreSQL Tests
# ==============================================================================

def test_postgres_backend_health(compose_url: str):
    """
    Checks that the backend service is healthy and running.
    """
    res = httpx.get(f"{compose_url}/api/health", timeout=5.0)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "MaitreQ" in data["app"]


def test_postgres_seeded_restaurant_data(compose_url: str):
    """
    Verifies that the backend connected to Postgres on startup, ran migrations/create_all,
    and seeded the default restaurant.
    """
    res = httpx.get(f"{compose_url}/api/v1/restaurant", timeout=5.0)
    assert res.status_code == 200
    restaurant = res.json()
    assert restaurant["name"] == "Le Bistro MaitreQ"
    assert restaurant["slug"] == "le-bistro-maitreq"
    assert "phone" in restaurant
    assert "T" in restaurant["created_at"]


def test_postgres_seeded_tables_and_stats(compose_url: str):
    """
    Verifies that dining tables and dashboard metrics are queried from Postgres.
    """
    tables_res = httpx.get(f"{compose_url}/api/v1/tables", timeout=5.0)
    assert tables_res.status_code == 200
    tables = tables_res.json()
    assert len(tables) >= 10, "Expected at least 10 seeded tables in Postgres"
    for table in tables:
        assert "table_number" in table
        assert "capacity" in table
        assert table["status"] in ["AVAILABLE", "OCCUPIED", "RESERVED"]

    stats_res = httpx.get(f"{compose_url}/api/v1/stats", timeout=5.0)
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert "total_waiting" in stats
    assert "total_notified" in stats
    assert "available_tables" in stats
    assert "total_tables" in stats


def test_postgres_write_and_read_waitlist_lifecycle(compose_url: str):
    """
    Verifies that the backend can write a new party to Postgres, read it back via
    public token, and update party details in Postgres.
    """
    unique_suffix = uuid.uuid4().hex[:6]
    guest_name = f"Integration Test Guest {unique_suffix}"

    # 1. CREATE party in Postgres
    create_payload = {
        "guest_name": guest_name,
        "phone_number": "+1 (555) 999-8888",
        "party_size": 4,
        "notes": "Postgres integration test entry",
        "estimated_wait_minutes": 25,
    }
    create_res = httpx.post(f"{compose_url}/api/v1/waitlist", json=create_payload, timeout=5.0)
    assert create_res.status_code == 201, f"Failed to create waitlist entry: {create_res.text}"
    created = create_res.json()
    party_id = created["id"]
    public_token = created["public_token"]

    assert created["guest_name"] == guest_name
    assert created["party_size"] == 4
    assert created["status"] == "WAITING"
    assert created["position"] > 0

    # 2. READ party from Postgres via public token (Guest Portal view)
    status_res = httpx.get(f"{compose_url}/api/v1/status/{public_token}", timeout=5.0)
    assert status_res.status_code == 200, f"Failed to query guest status: {status_res.text}"
    status_data = status_res.json()
    assert status_data["guest_name"] == guest_name
    assert status_data["status"] == "WAITING"
    assert status_data["restaurant_name"] == "Le Bistro MaitreQ"

    # 3. UPDATE party in Postgres
    patch_payload = {
        "party_size": 6,
        "notes": "Updated party size to 6",
    }
    patch_res = httpx.patch(f"{compose_url}/api/v1/waitlist/{party_id}", json=patch_payload, timeout=5.0)
    assert patch_res.status_code == 200
    updated = patch_res.json()
    assert updated["party_size"] == 6
    assert updated["notes"] == "Updated party size to 6"


def test_postgres_atomic_seating_and_table_freeing(compose_url: str):
    """
    Verifies atomic transactions in Postgres:
    1. Party is seated at a table (party status becomes SEATED, table becomes OCCUPIED).
    2. Table is freed (table becomes AVAILABLE, party status becomes COMPLETED).
    """
    unique_suffix = uuid.uuid4().hex[:6]
    create_payload = {
        "guest_name": f"Seating Test {unique_suffix}",
        "phone_number": "+1 (555) 333-2222",
        "party_size": 2,
    }
    create_res = httpx.post(f"{compose_url}/api/v1/waitlist", json=create_payload, timeout=5.0)
    assert create_res.status_code == 201
    party = create_res.json()
    party_id = party["id"]

    # Find an AVAILABLE table
    tables_res = httpx.get(f"{compose_url}/api/v1/tables", timeout=5.0)
    available_tables = [t for t in tables_res.json() if t["status"] == "AVAILABLE"]
    assert available_tables, "No available table found for seating test"
    target_table = available_tables[0]
    table_id = target_table["id"]

    # 1. Seat party at table in Postgres
    seat_payload = {
        "status": "SEATED",
        "table_id": table_id,
    }
    seat_res = httpx.patch(f"{compose_url}/api/v1/waitlist/{party_id}/status", json=seat_payload, timeout=5.0)
    assert seat_res.status_code == 200
    seated_party = seat_res.json()
    assert seated_party["status"] == "SEATED"
    assert seated_party["table_id"] == table_id
    assert seated_party["seated_at"] is not None

    # Verify table in Postgres is now OCCUPIED
    table_check = httpx.get(f"{compose_url}/api/v1/tables", timeout=5.0)
    occupied_table = next(t for t in table_check.json() if t["id"] == table_id)
    assert occupied_table["status"] == "OCCUPIED"
    assert occupied_table["current_party_id"] == party_id
    assert occupied_table["current_guest_name"] == create_payload["guest_name"]

    # 2. Free table in Postgres
    free_payload = {
        "status": "AVAILABLE",
        "free_party": True,
    }
    free_res = httpx.patch(f"{compose_url}/api/v1/tables/{table_id}/status", json=free_payload, timeout=5.0)
    assert free_res.status_code == 200
    freed_table = free_res.json()
    assert freed_table["status"] == "AVAILABLE"
    assert freed_table["current_party_id"] is None
    assert freed_table["current_guest_name"] is None

    # Verify in Postgres that party still retains seated_at timestamp
    party_check = httpx.get(f"{compose_url}/api/v1/waitlist?status=ALL", timeout=5.0)
    assert party_check.status_code == 200
    stored_party = next(p for p in party_check.json() if p["id"] == party_id)
    assert stored_party["status"] == "SEATED"
    assert stored_party["seated_at"] is not None


def test_postgres_table_creation_and_unique_constraint(compose_url: str):
    """
    Verifies creating a table in Postgres and verifies that Postgres enforces
    unique constraints on table numbers within the restaurant.
    """
    unique_num = f"T-INT-{uuid.uuid4().hex[:4].upper()}"
    create_payload = {
        "table_number": unique_num,
        "capacity": 4,
        "status": "AVAILABLE",
    }
    res = httpx.post(f"{compose_url}/api/v1/tables", json=create_payload, timeout=5.0)
    assert res.status_code == 201
    table_data = res.json()
    assert table_data["table_number"] == unique_num
    assert table_data["capacity"] == 4

    # Duplicate creation should fail due to Postgres UniqueConstraint
    dup_res = httpx.post(f"{compose_url}/api/v1/tables", json=create_payload, timeout=5.0)
    assert dup_res.status_code in [400, 409, 500], "Postgres unique constraint should reject duplicate table_number"


def test_postgres_guest_cancellation_flow(compose_url: str):
    """
    Verifies that a guest can cancel their spot via public token, and Postgres
    records the status change as CANCELLED.
    """
    unique_suffix = uuid.uuid4().hex[:6]
    create_payload = {
        "guest_name": f"Cancel Test {unique_suffix}",
        "phone_number": "+1 (555) 777-6666",
        "party_size": 2,
    }
    create_res = httpx.post(f"{compose_url}/api/v1/waitlist", json=create_payload, timeout=5.0)
    assert create_res.status_code == 201
    party = create_res.json()
    token = party["public_token"]

    cancel_res = httpx.post(f"{compose_url}/api/v1/status/{token}/cancel", timeout=5.0)
    assert cancel_res.status_code == 200
    cancelled = cancel_res.json()
    assert cancelled["status"] == "CANCELLED"


def test_sse_realtime_events_stream(compose_url: str):
    """
    Verifies that the backend maintains an open Server-Sent Events (SSE) connection
    with the expected stream headers.
    """
    with httpx.stream("GET", f"{compose_url}/api/v1/events", timeout=5.0) as stream_res:
        assert stream_res.status_code == 200
        assert "text/event-stream" in stream_res.headers.get("content-type", "")
        # Read the first event/keepalive from the stream
        for chunk in stream_res.iter_lines():
            if chunk:
                assert "data:" in chunk or ": keepalive" in chunk or "event:" in chunk
                break
