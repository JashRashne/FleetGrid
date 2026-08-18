from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from api.models import Trip, DailyLog


class TripPersistenceTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.sample_trip = Trip.objects.create(
            origin_name="Chicago, IL",
            pickup_name="Indianapolis, IN",
            dropoff_name="Atlanta, GA",
            current_cycle_used_hours=20.0,
            total_distance_miles=712.0,
            total_drive_time_hours=12.2,
            total_trip_duration_hours=14.8,
            days_required=2,
            fuel_stops_count=1,
            summary_json={"total_distance_miles": 712.0},
            locations_json={"current": {"name": "Chicago, IL"}}
        )
        self.sample_log = DailyLog.objects.create(
            trip=self.sample_trip,
            day_number=1,
            log_date="2026-08-18",
            driver_name="Alex Morgan",
            carrier_name="MileMint Logistics LLC",
            truck_id="TRK-9042",
            total_driving_hours=8.5,
            total_on_duty_hours=2.0,
            total_off_duty_hours=3.5,
            total_sleeper_hours=10.0,
            is_fmcsa_compliant=True
        )

    def test_list_trips(self):
        url = reverse('api-trips-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("trips", response.data)
        self.assertGreaterEqual(len(response.data["trips"]), 1)

    def test_retrieve_trip_detail(self):
        url = reverse('api-trip-detail', kwargs={'trip_id': self.sample_trip.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["origin_name"], "Chicago, IL")
        self.assertEqual(len(response.data["daily_logs"]), 1)

    def test_delete_trip(self):
        url = reverse('api-trip-detail', kwargs={'trip_id': self.sample_trip.id})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Trip.objects.filter(id=self.sample_trip.id).count(), 0)

    def test_list_daily_logs(self):
        url = reverse('api-logs-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("logs", response.data)
        self.assertGreaterEqual(len(response.data["logs"]), 1)
        self.assertEqual(response.data["logs"][0]["driver_name"], "Alex Morgan")
