from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status


class ApiViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_health_check_endpoint(self):
        resp = self.client.get('/api/health/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data.get("status"), "ok")

    def test_quick_cities_endpoint(self):
        resp = self.client.get('/api/cities/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("cities", resp.data)
        self.assertGreater(len(resp.data["cities"]), 5)

    def test_plan_trip_invalid_cycle_hours(self):
        # Negative cycle hours
        resp = self.client.post('/api/plan-trip/', {
            "current_location": "Chicago, IL",
            "pickup_location": "Indianapolis, IN",
            "dropoff_location": "Atlanta, GA",
            "current_cycle_used_hours": -5.0
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

        # > 70 cycle hours
        resp2 = self.client.post('/api/plan-trip/', {
            "current_location": "Chicago, IL",
            "pickup_location": "Indianapolis, IN",
            "dropoff_location": "Atlanta, GA",
            "current_cycle_used_hours": 75.0
        }, format='json')
        self.assertEqual(resp2.status_code, status.HTTP_400_BAD_REQUEST)

    def test_plan_trip_missing_fields(self):
        resp = self.client.post('/api/plan-trip/', {
            "current_location": "Chicago, IL"
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_plan_trip_success(self):
        resp = self.client.post('/api/plan-trip/', {
            "current_location": "Chicago, IL",
            "pickup_location": "Indianapolis, IN",
            "dropoff_location": "Atlanta, GA",
            "current_cycle_used_hours": 20.0
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data.get("status"), "success")
        self.assertIn("summary", resp.data)
        self.assertIn("daily_logs", resp.data)
        self.assertIn("route_geometry", resp.data)
        self.assertIn("events", resp.data)
