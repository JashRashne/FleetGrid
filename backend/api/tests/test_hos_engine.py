"""
Automated unit and boundary tests for FMCSA HOS domain engine and daily log generator.
"""

from django.test import TestCase
from api.services.hos_engine import (
    schedule_fmcsa_trip,
    RouteMilestone,
    DutyStatus,
    EventType,
    MAX_DRIVE_MINUTES,
    MAX_DUTY_WINDOW_MINUTES,
    MAX_CONTINUOUS_DRIVE_MINUTES,
    MANDATORY_BREAK_MINUTES,
    RESET_SLEEPER_MINUTES,
    RESTART_CYCLE_MINUTES,
    MAX_CYCLE_MINUTES
)
from api.services.log_generator import generate_daily_log_sheets, MINUTES_PER_DAY


class HosEngineBoundaryTests(TestCase):
    def test_8hr_continuous_driving_triggers_30m_break(self):
        """Continuous 9 hours (540 mins) of driving should inject a 30-min break at minute 480."""
        milestones = [
            RouteMilestone(
                name="Long Continuous Leg",
                milestone_type="DRIVE_LEG",
                distance_miles=500.0,
                duration_minutes=540,
                start_coords=(40.0, -80.0),
                end_coords=(40.0, -70.0),
                location_name="Midwest Route"
            )
        ]
        events = schedule_fmcsa_trip(milestones, current_cycle_used_minutes=0)
        break_events = [e for e in events if e.event_type == EventType.REST_BREAK_30.value]

        self.assertEqual(len(break_events), 1)
        self.assertEqual(break_events[0].duration_minutes, 30)
        self.assertEqual(break_events[0].duty_status, DutyStatus.OFF_DUTY.value)
        self.assertEqual(break_events[0].start_minutes, 480)

    def test_pickup_satisfies_30m_break_requirement(self):
        """A 60-min pickup after 6 hours (360 mins) driving should reset the break clock without needing a 30m break."""
        milestones = [
            RouteMilestone(
                name="Drive to Pickup",
                milestone_type="DRIVE_LEG",
                distance_miles=300.0,
                duration_minutes=360,
                start_coords=(40.0, -80.0),
                end_coords=(40.0, -75.0),
                location_name="Shipper A"
            ),
            RouteMilestone(
                name="Pickup at Shipper",
                milestone_type="TASK",
                distance_miles=0.0,
                duration_minutes=60,
                start_coords=(40.0, -75.0),
                end_coords=(40.0, -75.0),
                location_name="Shipper A"
            ),
            RouteMilestone(
                name="Drive to Dropoff",
                milestone_type="DRIVE_LEG",
                distance_miles=200.0,
                duration_minutes=240,
                start_coords=(40.0, -75.0),
                end_coords=(40.0, -70.0),
                location_name="Receiver B"
            )
        ]
        events = schedule_fmcsa_trip(milestones, current_cycle_used_minutes=0)
        # Since 360m drive + 60m pickup + 240m drive = driving after pickup is only 240m (<480m), no extra break is needed
        break_events = [e for e in events if e.event_type == EventType.REST_BREAK_30.value]
        self.assertEqual(len(break_events), 0)

    def test_11hr_driving_limit_triggers_10hr_sleeper(self):
        """Driving 12 hours (720 mins) should trigger a 10-hour (600 mins) sleeper reset at 660 mins."""
        milestones = [
            RouteMilestone(
                name="12-Hour Drive",
                milestone_type="DRIVE_LEG",
                distance_miles=700.0,
                duration_minutes=720,
                start_coords=(40.0, -80.0),
                end_coords=(40.0, -68.0),
                location_name="Route"
            )
        ]
        events = schedule_fmcsa_trip(milestones, current_cycle_used_minutes=0)
        sleeper_resets = [e for e in events if e.event_type == EventType.SLEEPER_RESET_10.value]

        self.assertGreaterEqual(len(sleeper_resets), 1)
        self.assertEqual(sleeper_resets[0].duration_minutes, 600)
        self.assertEqual(sleeper_resets[0].duty_status, DutyStatus.SLEEPER_BERTH.value)

    def test_14hr_duty_window_triggers_10hr_sleeper(self):
        """When 14-hour duty window (840 mins) is reached from driving + on-duty tasks, a 10h sleeper is required."""
        milestones = [
            RouteMilestone(
                name="Drive Leg 1",
                milestone_type="DRIVE_LEG",
                distance_miles=300.0,
                duration_minutes=360,
                start_coords=(40.0, -80.0),
                end_coords=(40.0, -75.0),
                location_name="Stop A"
            ),
            RouteMilestone(
                name="Long On-Duty Work",
                milestone_type="TASK",
                distance_miles=0.0,
                duration_minutes=300,  # 5 hours on-duty not driving
                start_coords=(40.0, -75.0),
                end_coords=(40.0, -75.0),
                location_name="Stop A"
            ),
            RouteMilestone(
                name="Drive Leg 2",
                milestone_type="DRIVE_LEG",
                distance_miles=300.0,
                duration_minutes=360,
                start_coords=(40.0, -75.0),
                end_coords=(40.0, -70.0),
                location_name="Stop B"
            )
        ]
        events = schedule_fmcsa_trip(milestones, current_cycle_used_minutes=0)
        sleeper_resets = [e for e in events if e.event_type == EventType.SLEEPER_RESET_10.value]
        self.assertGreaterEqual(len(sleeper_resets), 1)

    def test_70hr_cycle_limit_triggers_34hr_restart(self):
        """Driver starting with 68 hours cycle used should trigger 34h restart when 70h is reached."""
        milestones = [
            RouteMilestone(
                name="Drive Leg",
                milestone_type="DRIVE_LEG",
                distance_miles=250.0,
                duration_minutes=300,
                start_coords=(40.0, -80.0),
                end_coords=(40.0, -75.0),
                location_name="Stop A"
            )
        ]
        # 68 hours = 4,080 mins. Reaching 4,200 mins takes 120 mins.
        events = schedule_fmcsa_trip(milestones, current_cycle_used_minutes=4080)
        restarts = [e for e in events if e.event_type == EventType.CYCLE_RESTART_34.value]
        self.assertGreaterEqual(len(restarts), 1)
        self.assertEqual(restarts[0].duration_minutes, 2040)
        self.assertEqual(restarts[0].duty_status, DutyStatus.SLEEPER_BERTH.value)

    def test_fuel_stop_every_1000_miles(self):
        """A 1,600-mile trip must have at least 1 fuel stop at <= 1,000 miles."""
        milestones = [
            RouteMilestone(
                name="Cross Country Drive",
                milestone_type="DRIVE_LEG",
                distance_miles=1600.0,
                duration_minutes=1700,
                start_coords=(40.0, -100.0),
                end_coords=(40.0, -70.0),
                location_name="Coast-to-Coast"
            )
        ]
        events = schedule_fmcsa_trip(milestones, current_cycle_used_minutes=0)
        fuel_stops = [e for e in events if e.event_type == EventType.FUEL_STOP.value]
        self.assertGreaterEqual(len(fuel_stops), 1)
        self.assertLessEqual(fuel_stops[0].route_distance_miles, 1000.0)

    def test_daily_log_sheet_strictly_1440_minutes_per_day(self):
        """Every generated 24-hour log sheet must sum to exactly 1,440 minutes (24.0 hours)."""
        milestones = [
            RouteMilestone(
                name="Multi-Day Drive",
                milestone_type="DRIVE_LEG",
                distance_miles=1800.0,
                duration_minutes=2000,
                start_coords=(40.0, -100.0),
                end_coords=(40.0, -70.0),
                location_name="Multi-Day Corridor"
            )
        ]
        events = schedule_fmcsa_trip(milestones, current_cycle_used_minutes=0)
        daily_logs = generate_daily_log_sheets(events, start_time_iso="2026-08-18T08:00:00Z", initial_cycle_used_minutes=0)

        self.assertGreaterEqual(len(daily_logs), 2)
        for log in daily_logs:
            tot = log["totals_hours"]
            total_sum = tot["off_duty"] + tot["sleeper_berth"] + tot["driving"] + tot["on_duty_not_driving"]
            self.assertAlmostEqual(total_sum, 24.0, places=1)
