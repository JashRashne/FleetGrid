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

    # -------------------------------------------------------------------------
    # Targeted Regression Tests
    # -------------------------------------------------------------------------

    def test_multiple_driving_segments_do_not_overcount_mileage(self):
        """Regression Test 1: Multiple driving segments split by stops must sum exactly to total route miles."""
        milestones = [
            RouteMilestone(
                name="Leg 1",
                milestone_type="DRIVE_LEG",
                distance_miles=400.0,
                duration_minutes=480,
                start_coords=(40.0, -80.0),
                end_coords=(40.0, -75.0),
                location_name="Midwest 1"
            ),
            RouteMilestone(
                name="Pickup Task",
                milestone_type="TASK",
                distance_miles=0.0,
                duration_minutes=60,
                start_coords=(40.0, -75.0),
                end_coords=(40.0, -75.0),
                location_name="Midwest 1"
            ),
            RouteMilestone(
                name="Leg 2",
                milestone_type="DRIVE_LEG",
                distance_miles=200.0,
                duration_minutes=240,
                start_coords=(40.0, -75.0),
                end_coords=(40.0, -70.0),
                location_name="Midwest 2"
            )
        ]
        events = schedule_fmcsa_trip(milestones, current_cycle_used_minutes=0)
        driving_events = [e for e in events if e.duty_status == DutyStatus.DRIVING.value]
        self.assertGreaterEqual(len(driving_events), 2)

        # Sum of segment distances must equal total route distance (600.0 miles)
        total_segment_miles = sum(e.segment_distance_miles for e in driving_events)
        self.assertAlmostEqual(total_segment_miles, 600.0, places=2)

        # Daily logs must also sum to 600.0 miles, not overcounted cumulative positions
        daily_logs = generate_daily_log_sheets(events, start_time_iso="2026-08-18T08:00:00Z", initial_cycle_used_minutes=0)
        log_total_miles = sum(log["total_miles_driving_today"] for log in daily_logs)
        self.assertAlmostEqual(log_total_miles, 600.0, places=1)

    def test_driving_mileage_crossing_midnight_is_prorated_correctly(self):
        """Regression Test 2: Driving segment crossing midnight is prorated accurately between both daily sheets."""
        # Trip starts at 20:00 (minute 1200 of Day 1), runs for 6 hours (360 mins), 300 miles (50 mph)
        # Day 1 has 4 hours (240 mins) = 200 miles; Day 2 has 2 hours (120 mins) = 100 miles.
        milestones = [
            RouteMilestone(
                name="Overnight Drive",
                milestone_type="DRIVE_LEG",
                distance_miles=300.0,
                duration_minutes=360,
                start_coords=(40.0, -80.0),
                end_coords=(40.0, -75.0),
                location_name="Overnight Corridor"
            )
        ]
        events = schedule_fmcsa_trip(milestones, current_cycle_used_minutes=0, start_time_iso="2026-08-18T20:00:00Z")
        daily_logs = generate_daily_log_sheets(events, start_time_iso="2026-08-18T20:00:00Z", initial_cycle_used_minutes=0)

        self.assertEqual(len(daily_logs), 2)
        self.assertAlmostEqual(daily_logs[0]["total_miles_driving_today"], 200.0, places=1)
        self.assertAlmostEqual(daily_logs[1]["total_miles_driving_today"], 100.0, places=1)
        self.assertAlmostEqual(
            daily_logs[0]["total_miles_driving_today"] + daily_logs[1]["total_miles_driving_today"],
            300.0,
            places=1
        )

    def test_pickup_dropoff_may_push_cycle_usage_over_70h_without_restart(self):
        """Regression Test 3: On-duty non-driving dropoff may exceed 70h cycle without forcing 34h restart if trip ends."""
        # Cycle used = 69.5 hours (4,170 mins). 1-hour dropoff pushes cycle to 70.5 hours (4,230 mins).
        milestones = [
            RouteMilestone(
                name="Dropoff at Receiver",
                milestone_type="TASK",
                distance_miles=0.0,
                duration_minutes=60,
                start_coords=(40.0, -75.0),
                end_coords=(40.0, -75.0),
                location_name="Receiver Warehouse"
            )
        ]
        events = schedule_fmcsa_trip(milestones, current_cycle_used_minutes=4170)

        # No 34-hour restart should occur before the dropoff
        restarts = [e for e in events if e.event_type == EventType.CYCLE_RESTART_34.value]
        self.assertEqual(len(restarts), 0)

        # Dropoff event is present and on-duty not driving
        self.assertEqual(len(events), 1)
        self.assertEqual(events[0].event_type, EventType.DROPOFF.value)
        self.assertEqual(events[0].duty_status, DutyStatus.ON_DUTY_NOT_DRIVING.value)
        self.assertEqual(events[0].duration_minutes, 60)

    def test_further_driving_after_cycle_exhaustion_requires_restart(self):
        """Regression Test 4: Task may push cycle over 70h, but subsequent driving leg triggers 34h restart before driving."""
        milestones = [
            RouteMilestone(
                name="Pickup at Shipper",
                milestone_type="TASK",
                distance_miles=0.0,
                duration_minutes=60,
                start_coords=(40.0, -75.0),
                end_coords=(40.0, -75.0),
                location_name="Shipper Dock"
            ),
            RouteMilestone(
                name="Drive to Receiver",
                milestone_type="DRIVE_LEG",
                distance_miles=100.0,
                duration_minutes=120,
                start_coords=(40.0, -75.0),
                end_coords=(40.0, -73.0),
                location_name="Receiver City"
            )
        ]
        # Starting with 69.5 hours (4,170 mins). Pickup brings it to 70.5h.
        events = schedule_fmcsa_trip(milestones, current_cycle_used_minutes=4170)

        # First event must be the PICKUP task
        self.assertEqual(events[0].event_type, EventType.PICKUP.value)
        self.assertEqual(events[0].duty_status, DutyStatus.ON_DUTY_NOT_DRIVING.value)

        # Second event must be CYCLE_RESTART_34 before driving resumes
        self.assertEqual(events[1].event_type, EventType.CYCLE_RESTART_34.value)
        self.assertEqual(events[1].duration_minutes, RESTART_CYCLE_MINUTES)

        # Third event is DRIVE_SEGMENT
        self.assertEqual(events[2].event_type, EventType.DRIVE_SEGMENT.value)

    def test_daily_log_cycle_recap_resets_after_34h_restart(self):
        """Regression Test 5: Daily-log cycle recap resets to 0 after CYCLE_RESTART_34 completion."""
        # Initial cycle used = 68h (4,080 mins). 2h drive hits 70h, triggers 34h restart, followed by 4h drive.
        milestones = [
            RouteMilestone(
                name="Drive Leg",
                milestone_type="DRIVE_LEG",
                distance_miles=360.0,
                duration_minutes=360,  # 6 hours driving total: 2h pre-restart + 4h post-restart
                start_coords=(40.0, -80.0),
                end_coords=(40.0, -74.0),
                location_name="Interstate Corridor"
            )
        ]
        events = schedule_fmcsa_trip(milestones, current_cycle_used_minutes=4080, start_time_iso="2026-08-18T08:00:00Z")
        daily_logs = generate_daily_log_sheets(events, start_time_iso="2026-08-18T08:00:00Z", initial_cycle_used_minutes=4080)

        # Day 1: 2h driving -> 70h reached, restart begins
        day1_recap = daily_logs[0]["recap"]
        self.assertEqual(day1_recap["cycle_hours_at_start"], 68.0)
        self.assertEqual(day1_recap["on_duty_today_hours"], 2.0)
        self.assertEqual(day1_recap["cycle_hours_cumulative"], 70.0)
        self.assertEqual(day1_recap["cycle_hours_remaining"], 0.0)

        # Day 2: Start-of-day reflects 70.0h (midnight state). 34h restart completes on Day 2 (at 20:00), 4h driving follows
        day2_recap = daily_logs[1]["recap"]
        self.assertEqual(day2_recap["cycle_hours_at_start"], 70.0)
        self.assertEqual(day2_recap["on_duty_today_hours"], 4.0)
        self.assertEqual(day2_recap["cycle_hours_cumulative"], 4.0)
        self.assertEqual(day2_recap["cycle_hours_remaining"], 66.0)

    def test_restart_completion_during_calendar_day(self):
        """Regression Test 5b: Start-of-day cycle reflects midnight state, restart resets at completion, post-restart accumulates from 0."""
        # Initial cycle used = 69h (4,140 mins).
        # Trip departs at 04:00 Day 1 with 34h restart scheduled (e.g. driver reaches limit or initial cycle 69h).
        # 34h restart runs from 04:00 Day 1 to 14:00 Day 2, followed by 5h driving (14:00 to 19:00 Day 2).
        from api.services.hos_engine import TripEvent
        events = [
            TripEvent(
                event_id="evt_001",
                event_type=EventType.CYCLE_RESTART_34.value,
                duty_status=DutyStatus.SLEEPER_BERTH.value,
                start_minutes=0,
                end_minutes=2040,  # 34 hours
                duration_minutes=2040,
                start_time_iso="2026-08-18T04:00:00Z",
                end_time_iso="2026-08-19T14:00:00Z",
                route_distance_miles=0.0,
                latitude=40.0,
                longitude=-80.0,
                location_name="Rest Area",
                remark="34-Hour Cycle Restart",
                counts_toward_drive=False,
                counts_toward_shift=False,
                counts_toward_cycle=False,
                segment_distance_miles=0.0,
                route_mile_marker=0.0
            ),
            TripEvent(
                event_id="evt_002",
                event_type=EventType.DRIVE_SEGMENT.value,
                duty_status=DutyStatus.DRIVING.value,
                start_minutes=2040,
                end_minutes=2340,  # 5 hours driving (300 mins)
                duration_minutes=300,
                start_time_iso="2026-08-19T14:00:00Z",
                end_time_iso="2026-08-19T19:00:00Z",
                route_distance_miles=250.0,
                latitude=40.0,
                longitude=-75.0,
                location_name="Destination",
                remark="Driving (250 mi)",
                counts_toward_drive=True,
                counts_toward_shift=True,
                counts_toward_cycle=True,
                segment_distance_miles=250.0,
                route_mile_marker=250.0
            )
        ]
        daily_logs = generate_daily_log_sheets(events, start_time_iso="2026-08-18T04:00:00Z", initial_cycle_used_minutes=4140)

        # Day 1: 04:00 to 24:00 is restart (no on-duty today)
        day1_recap = daily_logs[0]["recap"]
        self.assertEqual(day1_recap["cycle_hours_at_start"], 69.0)
        self.assertEqual(day1_recap["on_duty_today_hours"], 0.0)
        self.assertEqual(day1_recap["cycle_hours_cumulative"], 69.0)
        self.assertEqual(day1_recap["cycle_hours_remaining"], 1.0)

        # Day 2: Cycle at midnight 00:00 is 69.0h. Restart completes at 14:00 Day 2 (resets to 0).
        # 5h driving follows from 14:00 to 19:00.
        day2_recap = daily_logs[1]["recap"]
        self.assertEqual(day2_recap["cycle_hours_at_start"], 69.0)
        self.assertEqual(day2_recap["on_duty_today_hours"], 5.0)
        self.assertEqual(day2_recap["cycle_hours_cumulative"], 5.0)
        self.assertEqual(day2_recap["cycle_hours_remaining"], 65.0)

    def test_every_daily_log_contains_exactly_1440_actual_segment_minutes(self):
        """Regression Test 6: Every daily log contains exactly 1,440 actual continuous segment minutes."""
        milestones = [
            RouteMilestone(
                name="Multi-Day Corridor",
                milestone_type="DRIVE_LEG",
                distance_miles=1200.0,
                duration_minutes=1400,
                start_coords=(40.0, -90.0),
                end_coords=(40.0, -70.0),
                location_name="I-80 Corridor"
            )
        ]
        events = schedule_fmcsa_trip(milestones, current_cycle_used_minutes=0, start_time_iso="2026-08-18T06:00:00Z")
        daily_logs = generate_daily_log_sheets(events, start_time_iso="2026-08-18T06:00:00Z", initial_cycle_used_minutes=0)

        for log in daily_logs:
            segments = log["segments"]
            self.assertEqual(segments[0]["start_minute"], 0)
            self.assertEqual(segments[-1]["end_minute"], MINUTES_PER_DAY)

            for i in range(len(segments)):
                self.assertGreater(segments[i]["duration_minutes"], 0)
                self.assertEqual(segments[i]["duration_minutes"], segments[i]["end_minute"] - segments[i]["start_minute"])
                if i > 0:
                    self.assertEqual(segments[i - 1]["end_minute"], segments[i]["start_minute"])

            self.assertEqual(sum(s["duration_minutes"] for s in segments), MINUTES_PER_DAY)

    def test_status_totals_equal_actual_segments(self):
        """Regression Test 7: Status totals in totals_hours match sum of segment durations exactly."""
        milestones = [
            RouteMilestone(
                name="Leg 1",
                milestone_type="DRIVE_LEG",
                distance_miles=500.0,
                duration_minutes=600,
                start_coords=(40.0, -80.0),
                end_coords=(40.0, -70.0),
                location_name="Route 1"
            )
        ]
        events = schedule_fmcsa_trip(milestones, current_cycle_used_minutes=0, start_time_iso="2026-08-18T08:00:00Z")
        daily_logs = generate_daily_log_sheets(events, start_time_iso="2026-08-18T08:00:00Z", initial_cycle_used_minutes=0)

        for log in daily_logs:
            seg_status_mins = {
                DutyStatus.OFF_DUTY.value: 0,
                DutyStatus.SLEEPER_BERTH.value: 0,
                DutyStatus.DRIVING.value: 0,
                DutyStatus.ON_DUTY_NOT_DRIVING.value: 0,
            }
            for s in log["segments"]:
                seg_status_mins[s["duty_status"]] += s["duration_minutes"]

            tot = log["totals_hours"]
            self.assertAlmostEqual(seg_status_mins[DutyStatus.OFF_DUTY.value] / 60.0, tot["off_duty"], places=2)
            self.assertAlmostEqual(seg_status_mins[DutyStatus.SLEEPER_BERTH.value] / 60.0, tot["sleeper_berth"], places=2)
            self.assertAlmostEqual(seg_status_mins[DutyStatus.DRIVING.value] / 60.0, tot["driving"], places=2)
            self.assertAlmostEqual(seg_status_mins[DutyStatus.ON_DUTY_NOT_DRIVING.value] / 60.0, tot["on_duty_not_driving"], places=2)
            self.assertAlmostEqual(tot["off_duty"] + tot["sleeper_berth"] + tot["driving"] + tot["on_duty_not_driving"], 24.0, places=2)

    def test_30m_fuel_satisfies_8hr_break_requirement(self):
        """Regression Test 8: Automatic 30-minute fuel stop at <=1000mi resets break clock without separate 30m break."""
        # 1,250 miles across 500 driving minutes (2.5 miles/min).
        # At 1,000 miles (minute 400), an automatic 30m FUEL_STOP is inserted before the 8h (480m) break limit.
        # Remaining 100 minutes of driving follows (total driving = 500 mins > 480 mins).
        milestones = [
            RouteMilestone(
                name="Long Haul Drive",
                milestone_type="DRIVE_LEG",
                distance_miles=1250.0,
                duration_minutes=500,
                start_coords=(40.0, -100.0),
                end_coords=(40.0, -70.0),
                location_name="Cross-Country Interstate"
            )
        ]
        events = schedule_fmcsa_trip(milestones, current_cycle_used_minutes=0)

        fuel_events = [e for e in events if e.event_type == EventType.FUEL_STOP.value]
        self.assertEqual(len(fuel_events), 1)
        self.assertEqual(fuel_events[0].duration_minutes, 30)
        self.assertEqual(fuel_events[0].duty_status, DutyStatus.ON_DUTY_NOT_DRIVING.value)
        self.assertEqual(fuel_events[0].start_minutes, 400)
        self.assertEqual(fuel_events[0].end_minutes, 430)

        break_events = [e for e in events if e.event_type == EventType.REST_BREAK_30.value]
        self.assertEqual(len(break_events), 0)

        driving_events = [e for e in events if e.duty_status == DutyStatus.DRIVING.value]
        self.assertEqual(len(driving_events), 2)
        self.assertEqual(driving_events[0].duration_minutes, 400)
        self.assertEqual(driving_events[1].duration_minutes, 100)
        self.assertAlmostEqual(
            sum(e.segment_distance_miles for e in driving_events),
            1250.0,
            places=1
        )

    def test_60m_pickup_dropoff_satisfies_8hr_break_requirement(self):
        """Regression Test 9: 60m pickup/dropoff satisfies the 8-hour consecutive non-driving break requirement."""
        milestones = [
            RouteMilestone(
                name="Drive to Shipper",
                milestone_type="DRIVE_LEG",
                distance_miles=350.0,
                duration_minutes=420,  # 7 hours driving
                start_coords=(40.0, -80.0),
                end_coords=(40.0, -74.0),
                location_name="Shipper Dock"
            ),
            RouteMilestone(
                name="Pickup at Shipper",
                milestone_type="TASK",
                distance_miles=0.0,
                duration_minutes=60,  # 1 hour On-Duty
                start_coords=(40.0, -74.0),
                end_coords=(40.0, -74.0),
                location_name="Shipper Dock"
            ),
            RouteMilestone(
                name="Drive to Receiver",
                milestone_type="DRIVE_LEG",
                distance_miles=180.0,
                duration_minutes=210,  # 3.5 hours driving
                start_coords=(40.0, -74.0),
                end_coords=(40.0, -70.0),
                location_name="Receiver Dock"
            )
        ]
        events = schedule_fmcsa_trip(milestones, current_cycle_used_minutes=0)
        # Total driving is 10.5h, but interrupted by 1h pickup after 7h. Driving after pickup is 3.5h (<8h).
        break_events = [e for e in events if e.event_type == EventType.REST_BREAK_30.value]
        self.assertEqual(len(break_events), 0)

    def test_non_driving_work_may_continue_after_14hr_driving_window(self):
        """Regression Test 10: Non-driving work (e.g. dropoff) may continue past the 14-hour driving window."""
        # 10 hours driving (600 mins) + 3.5 hours pickup (210 mins) = 810 mins (13.5 hours into shift).
        # Followed by 1 hour dropoff (60 mins) finishing at minute 870 (14.5 hours into shift).
        milestones = [
            RouteMilestone(
                name="Drive to Shipper",
                milestone_type="DRIVE_LEG",
                distance_miles=500.0,
                duration_minutes=600,  # 10 hours driving (within 11h limit)
                start_coords=(40.0, -80.0),
                end_coords=(40.0, -72.0),
                location_name="Shipper Dock"
            ),
            RouteMilestone(
                name="Pickup Loading at Shipper",
                milestone_type="TASK",
                distance_miles=0.0,
                duration_minutes=210,  # 3.5 hours on-duty not driving -> total shift = 810 mins (13.5 hrs)
                start_coords=(40.0, -72.0),
                end_coords=(40.0, -72.0),
                location_name="Shipper Dock"
            ),
            RouteMilestone(
                name="Dropoff Unloading at Receiver",
                milestone_type="TASK",
                distance_miles=0.0,
                duration_minutes=60,  # 1 hour on-duty -> finishes at 870 mins (14.5 hrs)
                start_coords=(40.0, -72.0),
                end_coords=(40.0, -72.0),
                location_name="Receiver Dock"
            )
        ]
        events = schedule_fmcsa_trip(milestones, current_cycle_used_minutes=0)
        dropoff_events = [e for e in events if e.event_type == EventType.DROPOFF.value]
        self.assertEqual(len(dropoff_events), 1)
        self.assertEqual(dropoff_events[0].start_minutes, 840)
        self.assertEqual(dropoff_events[0].end_minutes, 900)
        self.assertEqual(dropoff_events[0].duty_status, DutyStatus.ON_DUTY_NOT_DRIVING.value)

    def test_canonical_timeline_invariants_no_gaps_no_overlaps(self):
        """Requirement Invariant Test: For all events, duration > 0, end > start, events[i].end == events[i+1].start."""
        milestones = [
            RouteMilestone(
                name="Drive Leg 1",
                milestone_type="DRIVE_LEG",
                distance_miles=600.0,
                duration_minutes=720,
                start_coords=(40.0, -85.0),
                end_coords=(40.0, -75.0),
                location_name="Point A to B"
            ),
            RouteMilestone(
                name="Pickup Task",
                milestone_type="TASK",
                distance_miles=0.0,
                duration_minutes=60,
                start_coords=(40.0, -75.0),
                end_coords=(40.0, -75.0),
                location_name="Point B"
            ),
            RouteMilestone(
                name="Drive Leg 2",
                milestone_type="DRIVE_LEG",
                distance_miles=600.0,
                duration_minutes=720,
                start_coords=(40.0, -75.0),
                end_coords=(40.0, -65.0),
                location_name="Point B to C"
            ),
            RouteMilestone(
                name="Dropoff Task",
                milestone_type="TASK",
                distance_miles=0.0,
                duration_minutes=60,
                start_coords=(40.0, -65.0),
                end_coords=(40.0, -65.0),
                location_name="Point C"
            )
        ]
        events = schedule_fmcsa_trip(milestones, current_cycle_used_minutes=1200)
        self.assertGreater(len(events), 0)
        self.assertEqual(events[0].start_minutes, 0)

        for i in range(len(events)):
            evt = events[i]
            self.assertGreater(evt.duration_minutes, 0)
            self.assertGreater(evt.end_minutes, evt.start_minutes)
            self.assertEqual(evt.duration_minutes, evt.end_minutes - evt.start_minutes)

            # Check counts_toward_shift semantics
            if evt.event_type in [EventType.SLEEPER_RESET_10.value, EventType.CYCLE_RESTART_34.value, EventType.END_OFF_DUTY.value]:
                self.assertFalse(evt.counts_toward_shift)
            else:
                self.assertTrue(evt.counts_toward_shift)

            if i > 0:
                self.assertEqual(events[i - 1].end_minutes, evt.start_minutes)
