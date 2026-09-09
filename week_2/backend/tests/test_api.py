import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_get_restaurant(client: AsyncClient):
    response = await client.get("/api/v1/restaurant")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Le Bistro MaitreQ"
    assert "slug" in data
    assert "phone" in data

@pytest.mark.asyncio
async def test_list_waitlist(client: AsyncClient):
    response = await client.get("/api/v1/waitlist")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    # Active items should be sorted by position
    active = [p for p in data if p["status"] in ("WAITING", "NOTIFIED")]
    positions = [p["position"] for p in active]
    assert positions == sorted(positions)

@pytest.mark.asyncio
async def test_create_waitlist_entry(client: AsyncClient):
    payload = {
        "guest_name": "Eleanor Rigby",
        "phone_number": "+1 (555) 789-0123",
        "party_size": 3,
        "notes": "Window table preferred",
        "estimated_wait_minutes": 20
    }
    response = await client.post("/api/v1/waitlist", json=payload)
    assert response.status_code == 201
    created = response.json()
    assert created["guest_name"] == "Eleanor Rigby"
    assert created["party_size"] == 3
    assert created["status"] == "WAITING"
    assert "public_token" in created
    assert created["position"] > 0
    assert created["estimated_wait_minutes"] == 20

@pytest.mark.asyncio
async def test_edit_waitlist_entry(client: AsyncClient):
    list_res = await client.get("/api/v1/waitlist")
    entry_id = list_res.json()[0]["id"]

    patch_payload = {
        "party_size": 5,
        "notes": "Updated note: need booster seat"
    }
    response = await client.patch(f"/api/v1/waitlist/{entry_id}", json=patch_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["party_size"] == 5
    assert data["notes"] == "Updated note: need booster seat"

@pytest.mark.asyncio
async def test_status_transitions_and_table_seating(client: AsyncClient):
    # 1. Create a fresh party
    res = await client.post("/api/v1/waitlist", json={
        "guest_name": "Test Transition",
        "phone_number": "+1 555 111 2222",
        "party_size": 2
    })
    party_id = res.json()["id"]
    token = res.json()["public_token"]

    # 2. Transition to NOTIFIED
    res_notify = await client.patch(f"/api/v1/waitlist/{party_id}/status", json={"status": "NOTIFIED"})
    assert res_notify.status_code == 200
    assert res_notify.json()["status"] == "NOTIFIED"
    assert res_notify.json()["notified_at"] is not None

    # 3. Find an available table
    tbl_res = await client.get("/api/v1/tables")
    available_table = next(t for t in tbl_res.json() if t["status"] == "AVAILABLE")

    # 4. Seat party at table
    res_seat = await client.patch(f"/api/v1/waitlist/{party_id}/status", json={
        "status": "SEATED",
        "table_id": available_table["id"]
    })
    assert res_seat.status_code == 200
    assert res_seat.json()["status"] == "SEATED"
    assert res_seat.json()["table_id"] == available_table["id"]
    assert res_seat.json()["position"] == 0

    # 5. Check table is now OCCUPIED
    tbl_check = await client.get("/api/v1/tables")
    updated_tbl = next(t for t in tbl_check.json() if t["id"] == available_table["id"])
    assert updated_tbl["status"] == "OCCUPIED"
    assert updated_tbl["current_guest_name"] == "Test Transition"

    # 6. Guest Portal check
    guest_res = await client.get(f"/api/v1/status/{token}")
    assert guest_res.status_code == 200
    assert guest_res.json()["status"] == "SEATED"
    assert guest_res.json()["assigned_table_number"] == available_table["table_number"]

@pytest.mark.asyncio
async def test_reorder_queue(client: AsyncClient):
    list_res = await client.get("/api/v1/waitlist")
    initial_active = [p for p in list_res.json() if p["status"] in ("WAITING", "NOTIFIED")]
    first_id = initial_active[0]["id"]
    second_id = initial_active[1]["id"]

    # Swap top two
    reorder_res = await client.post("/api/v1/waitlist/reorder", json={
        "from_index": 0,
        "to_index": 1
    })
    assert reorder_res.status_code == 200
    new_active = [p for p in reorder_res.json() if p["status"] in ("WAITING", "NOTIFIED")]
    assert new_active[0]["id"] == second_id
    assert new_active[1]["id"] == first_id
    assert new_active[0]["position"] == 1
    assert new_active[1]["position"] == 2

@pytest.mark.asyncio
async def test_table_operations(client: AsyncClient):
    # Create Table
    new_tbl_res = await client.post("/api/v1/tables", json={
        "table_number": "Patio 99",
        "capacity": 6,
        "status": "AVAILABLE"
    })
    assert new_tbl_res.status_code == 201
    tbl_id = new_tbl_res.json()["id"]
    assert new_tbl_res.json()["table_number"] == "Patio 99"

    # Update Table Status
    patch_res = await client.patch(f"/api/v1/tables/{tbl_id}/status", json={
        "status": "RESERVED"
    })
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "RESERVED"

@pytest.mark.asyncio
async def test_guest_portal_and_self_cancellation(client: AsyncClient):
    # Add guest
    add_res = await client.post("/api/v1/waitlist", json={
        "guest_name": "Oliver Twist",
        "phone_number": "+1 555 999 8888",
        "party_size": 1
    })
    token = add_res.json()["public_token"]

    # Fetch status
    status_res = await client.get(f"/api/v1/status/{token}")
    assert status_res.status_code == 200
    assert status_res.json()["guest_name"] == "Oliver Twist"
    assert status_res.json()["status"] == "WAITING"

    # Cancel spot
    cancel_res = await client.post(f"/api/v1/status/{token}/cancel")
    assert cancel_res.status_code == 200
    assert cancel_res.json()["status"] == "CANCELLED"

    # Verify status is updated
    updated_status = await client.get(f"/api/v1/status/{token}")
    assert updated_status.json()["status"] == "CANCELLED"
    assert updated_status.json()["position"] == 0

@pytest.mark.asyncio
async def test_dashboard_stats(client: AsyncClient):
    res = await client.get("/api/v1/stats")
    assert res.status_code == 200
    stats = res.json()
    assert "total_waiting" in stats
    assert "total_notified" in stats
    assert "total_seated_today" in stats
    assert "avg_wait_minutes" in stats
    assert "available_tables" in stats
    assert "total_tables" in stats

@pytest.mark.asyncio
async def test_demo_reset(client: AsyncClient):
    res = await client.post("/api/v1/demo/reset")
    assert res.status_code == 200
    assert res.json()["success"] is True

@pytest.mark.asyncio
async def test_table_free_party_workflow(client: AsyncClient):
    # 1. Get an occupied table
    tbls = await client.get("/api/v1/tables")
    occupied = next(t for t in tbls.json() if t["status"] == "OCCUPIED")
    assert occupied["current_guest_name"] is not None

    # 2. Free table
    free_res = await client.patch(f"/api/v1/tables/{occupied['id']}/status", json={
        "status": "AVAILABLE",
        "free_party": True
    })
    assert free_res.status_code == 200
    assert free_res.json()["status"] == "AVAILABLE"
    assert free_res.json()["current_party_id"] is None
    assert free_res.json()["current_guest_name"] is None

@pytest.mark.asyncio
async def test_nonexistent_routes_and_entities_return_404(client: AsyncClient):
    res = await client.get("/api/v1/status/non-existent-token-xyz")
    assert res.status_code == 404

    patch_res = await client.patch("/api/v1/waitlist/non-existent-id/status", json={"status": "NOTIFIED"})
    assert patch_res.status_code == 404

@pytest.mark.asyncio
async def test_utc_timestamps_formatting(client: AsyncClient):
    res = await client.get("/api/v1/restaurant")
    assert res.status_code == 200
    created_at = res.json()["created_at"]
    assert "T" in created_at

    waitlist_res = await client.get("/api/v1/waitlist")
    assert waitlist_res.status_code == 200
    for entry in waitlist_res.json():
        assert "T" in entry["created_at"]
