"""
フロントエンド仕様に基づくバックエンドAPI統合テスト

実行方法:
    cd backend
    pip install pytest pytest-django requests
    pytest ../tests/test_api_integration.py -v

環境変数:
    API_BASE_URL=http://localhost:8000/api (デフォルト)
"""
import os
import pytest
import requests
from typing import Dict, Any

API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000/api")


class TestGeoAPI:
    """地域・国・都市APIのテスト"""
    
    def test_get_regions(self):
        """地域一覧を取得"""
        res = requests.get(f"{API_BASE_URL}/regions/")
        assert res.status_code == 200
        data = res.json()
        assert isinstance(data, list)
        if len(data) > 0:
            assert "id" in data[0]
            assert "name" in data[0]
            assert "code" in data[0]

    def test_get_countries_by_region(self):
        """地域で国をフィルタ"""
        res = requests.get(f"{API_BASE_URL}/countries/?region_code=ASIA")
        assert res.status_code == 200
        data = res.json()
        assert isinstance(data, list)

    def test_get_cities_by_country(self):
        """国で都市をフィルタ"""
        res = requests.get(f"{API_BASE_URL}/cities/?country=日本")
        assert res.status_code == 200
        data = res.json()
        assert isinstance(data, list)


class TestUsersAPI:
    """ユーザーAPIのテスト"""
    
    def test_list_users(self):
        """ユーザー一覧"""
        res = requests.get(f"{API_BASE_URL}/users/")
        assert res.status_code == 200
        data = res.json()
        assert isinstance(data, list)

    def test_search_users(self):
        """ユーザー検索"""
        res = requests.get(f"{API_BASE_URL}/users/?search=tanaka")
        assert res.status_code == 200
        data = res.json()
        assert isinstance(data, list)


class TestTripsAPI:
    """旅行予定APIのテスト"""
    
    def test_list_trips(self):
        """旅行予定一覧"""
        res = requests.get(f"{API_BASE_URL}/trips/")
        assert res.status_code == 200
        data = res.json()
        assert isinstance(data, list)

    def test_list_trips_with_filters(self):
        """フィルタ付き一覧"""
        res = requests.get(
            f"{API_BASE_URL}/trips/",
            params={"type": "trip", "is_recruitment": "true"}
        )
        assert res.status_code == 200
        data = res.json()
        assert isinstance(data, list)

    def test_create_trip(self):
        """旅行予定を作成"""
        payload = {
            "type": "trip",
            "user_discord_id": "123456789012345678",
            "user_name": "テストユーザー",
            "country": "日本",
            "city": "東京",
            "start_date": "2025-11-05",
            "end_date": "2025-11-10",
            "description": "テスト旅行",
            "is_recruitment": False,
        }
        res = requests.post(
            f"{API_BASE_URL}/trips/",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        assert res.status_code == 201
        data = res.json()
        assert data["type"] == "trip"
        assert data["country"] == "日本"
        return data["id"]

    def test_update_trip(self, trip_id: str):
        """旅行予定を更新"""
        payload = {"description": "更新された説明"}
        res = requests.patch(
            f"{API_BASE_URL}/trips/{trip_id}/",
            json=payload
        )
        assert res.status_code == 200
        data = res.json()
        assert data["description"] == "更新された説明"

    def test_join_trip(self, trip_id: str):
        """旅行予定に参加"""
        payload = {"discord_id": "234567890123456789"}
        res = requests.post(
            f"{API_BASE_URL}/trips/{trip_id}/join/",
            json=payload
        )
        assert res.status_code == 200
        data = res.json()
        assert "234567890123456789" in data.get("participants", [])

    def test_leave_trip(self, trip_id: str):
        """旅行予定から退出"""
        payload = {"discord_id": "234567890123456789"}
        res = requests.post(
            f"{API_BASE_URL}/trips/{trip_id}/leave/",
            json=payload
        )
        assert res.status_code == 200

    def test_toggle_recruitment(self, trip_id: str):
        """募集ON/OFF"""
        payload = {"is_recruitment": True}
        res = requests.post(
            f"{API_BASE_URL}/trips/{trip_id}/toggle_recruitment/",
            json=payload
        )
        assert res.status_code == 200
        data = res.json()
        assert data["is_recruitment"] is True

    def test_end_recruitment(self, trip_id: str):
        """募集終了"""
        res = requests.post(
            f"{API_BASE_URL}/trips/{trip_id}/end_recruitment/"
        )
        assert res.status_code == 200
        data = res.json()
        assert data["is_recruitment"] is False

    def test_toggle_hidden(self, trip_id: str):
        """非表示ON/OFF"""
        payload = {"is_hidden": True}
        res = requests.post(
            f"{API_BASE_URL}/trips/{trip_id}/toggle_hidden/",
            json=payload
        )
        assert res.status_code == 200

    def test_delete_trip(self, trip_id: str):
        """旅行予定を削除"""
        res = requests.delete(f"{API_BASE_URL}/trips/{trip_id}/")
        assert res.status_code in (200, 204)


class TestNotificationsAPI:
    """通知APIのテスト"""
    
    def test_get_notifications(self):
        """通知一覧"""
        res = requests.get(
            f"{API_BASE_URL}/notifications/",
            params={"user_discord_id": "123456789012345678"}
        )
        assert res.status_code == 200
        data = res.json()
        assert isinstance(data, list)

    def test_get_notifications_count(self):
        """通知数カウント"""
        res = requests.get(
            f"{API_BASE_URL}/notifications/count",
            params={"user_discord_id": "123456789012345678"}
        )
        assert res.status_code == 200
        data = res.json()
        assert "total" in data
        assert "unread" in data

    def test_mark_all_read(self):
        """全通知を既読化"""
        payload = {"user_discord_id": "123456789012345678"}
        res = requests.post(
            f"{API_BASE_URL}/notifications/mark_all_read/",
            json=payload
        )
        assert res.status_code == 200


class TestCommentsAPI:
    """コメントAPIのテスト"""
    
    def test_create_comment(self, trip_id: str):
        """コメント作成"""
        payload = {
            "trip": trip_id,
            "user_discord_id": "123456789012345678",
            "user_name": "テストユーザー",
            "content": "いい旅ですね！"
        }
        res = requests.post(
            f"{API_BASE_URL}/comments/",
            json=payload
        )
        assert res.status_code == 201
        data = res.json()
        assert data["content"] == "いい旅ですね！"
        return data["id"]

    def test_list_comments(self, trip_id: str):
        """コメント一覧"""
        res = requests.get(
            f"{API_BASE_URL}/comments/",
            params={"trip": trip_id}
        )
        assert res.status_code == 200
        data = res.json()
        assert isinstance(data, list)

    def test_update_comment(self, comment_id: str):
        """コメント更新"""
        payload = {"content": "更新されたコメント"}
        res = requests.patch(
            f"{API_BASE_URL}/comments/{comment_id}/",
            json=payload
        )
        assert res.status_code == 200

    def test_delete_comment(self, comment_id: str):
        """コメント削除"""
        res = requests.delete(f"{API_BASE_URL}/comments/{comment_id}/")
        assert res.status_code in (200, 204)


class TestDateProposalsAPI:
    """日程候補・投票APIのテスト"""
    
    def test_create_proposal(self, trip_id: str):
        """日程候補を作成"""
        payload = {
            "trip": trip_id,
            "date": "2025-11-15",
            "created_by_discord_id": "123456789012345678"
        }
        res = requests.post(
            f"{API_BASE_URL}/date_proposals/",
            json=payload
        )
        assert res.status_code == 201
        data = res.json()
        assert "id" in data
        return data["id"]

    def test_list_proposals(self, trip_id: str):
        """日程候補一覧"""
        res = requests.get(
            f"{API_BASE_URL}/date_proposals/",
            params={"trip": trip_id}
        )
        assert res.status_code == 200
        data = res.json()
        assert isinstance(data, list)

    def test_vote(self, proposal_id: str):
        """投票"""
        payload = {"user_discord_id": "123456789012345678"}
        res = requests.post(
            f"{API_BASE_URL}/date_proposals/{proposal_id}/vote/",
            json=payload
        )
        assert res.status_code == 201

    def test_get_votes(self, proposal_id: str):
        """投票一覧"""
        res = requests.get(
            f"{API_BASE_URL}/date_proposals/{proposal_id}/votes/"
        )
        assert res.status_code == 200
        data = res.json()
        assert isinstance(data, list)

    def test_unvote(self, proposal_id: str):
        """投票取消"""
        payload = {"user_discord_id": "123456789012345678"}
        res = requests.post(
            f"{API_BASE_URL}/date_proposals/{proposal_id}/unvote/",
            json=payload
        )
        assert res.status_code == 200

    def test_delete_proposal(self, proposal_id: str):
        """日程候補削除"""
        res = requests.delete(f"{API_BASE_URL}/date_proposals/{proposal_id}/")
        assert res.status_code in (200, 204)


@pytest.fixture
def trip_id():
    """テスト用Tripを作成してIDを返す（テスト後に削除）"""
    payload = {
        "type": "trip",
        "user_discord_id": "123456789012345678",
        "user_name": "テストユーザー",
        "country": "日本",
        "city": "東京",
        "start_date": "2025-11-05",
        "end_date": "2025-11-10",
        "description": "テスト用旅行",
    }
    res = requests.post(f"{API_BASE_URL}/trips/", json=payload)
    assert res.status_code == 201
    tid = res.json()["id"]
    yield tid
    # クリーンアップ
    requests.delete(f"{API_BASE_URL}/trips/{tid}/")

