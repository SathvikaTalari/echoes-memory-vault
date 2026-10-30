import unittest
import json
import os
import sys

# Add parent folder to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app import create_app
from database import init_db, get_db

class EchoesApiTestCase(unittest.TestCase):
    def setUp(self):
        init_db()
        self.app = create_app()
        self.app.config["TESTING"] = True
        self.client = self.app.test_client()

    def test_01_health_check(self):
        """Test system health endpoint"""
        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["status"], "online")
        self.assertIn("Echoes", data["project"])

    def test_02_system_status(self):
        """Test system diagnostic status"""
        res = self.client.get("/api/system/status")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["offline_ready"])
        self.assertIn("ai_subsystems", data)
        self.assertIn("ollama", data["ai_subsystems"])
        self.assertIn("whisper", data["ai_subsystems"])

    def test_03_auth_login_seeded_user(self):
        """Test login with demo user seeded during init"""
        res = self.client.post("/api/auth/login", json={
            "username": "demo",
            "password": "echoes2026"
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn("token", data)
        self.assertIn("user", data)
        self.assertEqual(data["user"]["username"], "demo")

    def test_04_auth_signup_new_user(self):
        """Test user signup and token receipt"""
        import uuid
        unique_user = f"user_{uuid.uuid4().hex[:6]}"
        res = self.client.post("/api/auth/signup", json={
            "username": unique_user,
            "password": "secretpassword",
            "display_name": "Test Keeper",
            "email": f"{unique_user}@test.local"
        })
        self.assertEqual(res.status_code, 201)
        data = res.get_json()
        self.assertIn("token", data)
        self.assertEqual(data["user"]["username"], unique_user)

    def test_05_loved_ones_sanctuary(self):
        """Test listing and creating a loved one profile"""
        # Login first
        login_res = self.client.post("/api/auth/login", json={
            "username": "demo",
            "password": "echoes2026"
        })
        token = login_res.get_json()["token"]
        headers = {"Authorization": f"Bearer {token}"}

        # List loved ones
        list_res = self.client.get("/api/loved-ones", headers=headers)
        self.assertEqual(list_res.status_code, 200)
        loved_ones = list_res.get_json()["loved_ones"]
        self.assertGreaterEqual(len(loved_ones), 1)

        # Create new profile
        create_res = self.client.post("/api/loved-ones", headers=headers, json={
            "name": "Grandfather Manuel",
            "relationship": "Grandfather",
            "birth_date": "1930-08-10",
            "passing_date": "2018-05-20",
            "resting_place": "Oaxaca de Juárez",
            "epitaph": "Always dancing in the rain.",
            "bio": "A steadfast soul who cherished marimba music and morning walks."
        })
        self.assertEqual(create_res.status_code, 201)
        new_profile = create_res.get_json()["loved_one"]
        self.assertEqual(new_profile["name"], "Grandfather Manuel")

    def test_06_story_generation_and_saving(self):
        """Test AI Memory Storyteller generation and saving"""
        login_res = self.client.post("/api/auth/login", json={
            "username": "demo",
            "password": "echoes2026"
        })
        token = login_res.get_json()["token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Get first loved one
        list_res = self.client.get("/api/loved-ones", headers=headers)
        loved_one_id = list_res.get_json()["loved_ones"][0]["id"]

        # Generate story from transcript
        gen_res = self.client.post(f"/api/loved-ones/{loved_one_id}/stories/generate", headers=headers, json={
            "transcript": "We planted the heirloom corn right before the July solstice. Abuela said the earth remembers what hands put into it.",
            "style": "Life Lesson & Wisdom",
            "context_notes": "Recollections of the mountain farm"
        })
        self.assertEqual(gen_res.status_code, 200)
        story_draft = gen_res.get_json()["generated_story"]
        self.assertIn("title", story_draft)
        self.assertIn("narrative", story_draft)
        self.assertIn("key_wisdom", story_draft)

        # Save story to vault
        save_res = self.client.post(f"/api/loved-ones/{loved_one_id}/stories", headers=headers, json={
            "title": story_draft["title"],
            "narrative": story_draft["narrative"],
            "story_style": "Life Lesson & Wisdom",
            "key_wisdom": story_draft["key_wisdom"],
            "era_timeframe": story_draft.get("era_timeframe", "1975"),
            "tags": ["Farming", "Solstice", "Wisdom"]
        })
        self.assertEqual(save_res.status_code, 201)

    def test_07_virtual_ofrenda(self):
        """Test Virtual Ofrenda offerings and interactive candles"""
        login_res = self.client.post("/api/auth/login", json={
            "username": "demo",
            "password": "echoes2026"
        })
        token = login_res.get_json()["token"]
        headers = {"Authorization": f"Bearer {token}"}

        list_res = self.client.get("/api/loved-ones", headers=headers)
        loved_one_id = list_res.get_json()["loved_ones"][0]["id"]

        # Get ofrenda
        ofrenda_res = self.client.get(f"/api/loved-ones/{loved_one_id}/ofrenda", headers=headers)
        self.assertEqual(ofrenda_res.status_code, 200)
        data = ofrenda_res.get_json()
        self.assertIn("offerings_by_tier", data)
        self.assertIn("candles", data)

        # Add offering
        add_off_res = self.client.post(f"/api/loved-ones/{loved_one_id}/ofrenda/offerings", headers=headers, json={
            "title": "Fresh Baked Concha",
            "item_type": "pan_de_muerto",
            "tier": 2,
            "dedication_note": "Your favorite morning sweet bread.",
            "placed_by": "Grandson Alex"
        })
        self.assertEqual(add_off_res.status_code, 201)

        # Light candle
        light_res = self.client.post(f"/api/loved-ones/{loved_one_id}/ofrenda/candles", headers=headers, json={
            "lit_by": "Grandson Alex",
            "message": "Lighting this flame with immense gratitude.",
            "candle_type": "cempasuchil_gold"
        })
        self.assertEqual(light_res.status_code, 201)
        candle_id = light_res.get_json()["candle"]["id"]

        # Toggle candle
        toggle_res = self.client.put(f"/api/ofrenda/candles/{candle_id}/toggle", headers=headers)
        self.assertEqual(toggle_res.status_code, 200)
        self.assertEqual(toggle_res.get_json()["is_lit"], 0)

    def test_08_ask_memories_rag(self):
        """Test Ask Your Memories factual retrieval"""
        login_res = self.client.post("/api/auth/login", json={
            "username": "demo",
            "password": "echoes2026"
        })
        token = login_res.get_json()["token"]
        headers = {"Authorization": f"Bearer {token}"}

        list_res = self.client.get("/api/loved-ones", headers=headers)
        loved_one_id = list_res.get_json()["loved_ones"][0]["id"]

        # Ask question
        ask_res = self.client.post(f"/api/loved-ones/{loved_one_id}/ask", headers=headers, json={
            "question": "What happened during the rainstorm in the plaza in Oaxaca?"
        })
        self.assertEqual(ask_res.status_code, 200)
        data = ask_res.get_json()
        self.assertIn("answer", data)
        self.assertIn("cited_sources", data)

    def test_09_memory_book_export(self):
        """Test exporting Heirloom Memory Book in Markdown"""
        login_res = self.client.post("/api/auth/login", json={
            "username": "demo",
            "password": "echoes2026"
        })
        token = login_res.get_json()["token"]
        headers = {"Authorization": f"Bearer {token}"}

        list_res = self.client.get("/api/loved-ones", headers=headers)
        loved_one_id = list_res.get_json()["loved_ones"][0]["id"]

        export_res = self.client.get(f"/api/loved-ones/{loved_one_id}/export", headers=headers)
        self.assertEqual(export_res.status_code, 200)
        data = export_res.get_json()
        self.assertIn("markdown_content", data)
        self.assertIn("ECHOES: THE HEIRLOOM MEMORY BOOK", data["markdown_content"])

if __name__ == "__main__":
    unittest.main()
