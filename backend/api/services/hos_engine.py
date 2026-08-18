"""
FMCSA Hours of Service (HOS) trip-planning engine.

Models the property-carrying driver HOS constraints required by the
assessment, subject to the documented input assumptions and limitations.

Calculations are performed in integer minutes to eliminate floating-point
rounding errors.

Key Assumptions & Limitations:
1. Current Cycle Used Limitation:
   The assignment supplies only aggregate Current Cycle Used and does not provide
   the driver's previous 8 days of timestamped duty history. Therefore a true rolling
   70-hour/8-day calculation cannot be reconstructed. Our planner conservatively assumes
   previously accumulated cycle hours do not roll off during the planned trip.
   When no driving capacity remains, it uses a 34-hour restart as a conservative planning strategy.
   The 34-hour restart is an operational planning strategy and not universally mandatory under FMCSA.

2. Fresh Daily HOS Clock Assumption:
   The assignment does not provide the driver's current duty-shift history prior to dispatch.
   Therefore, the planner assumes the trip begins after a qualifying rest period with:
   - 11-hour driving clock = fresh (0 / 660 mins used)
   - 14-hour duty window = fresh (0 / 840 mins elapsed)
   - 8-hour cumulative-driving break clock = fresh (0 / 480 mins elapsed)
   The generated daily log represents any time prior to departure on Day 1 as OFF_DUTY.
"""

from dataclasses import dataclass, asdict
from enum import Enum
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta


class DutyStatus(str, Enum):
    OFF_DUTY = "OFF_DUTY"
    SLEEPER_BERTH = "SLEEPER_BERTH"
    DRIVING = "DRIVING"
    ON_DUTY_NOT_DRIVING = "ON_DUTY_NOT_DRIVING"


class EventType(str, Enum):
    START = "START"
    DRIVE_SEGMENT = "DRIVE_SEGMENT"
    REST_BREAK_30 = "REST_BREAK_30"
    SLEEPER_RESET_10 = "SLEEPER_RESET_10"
    CYCLE_RESTART_34 = "CYCLE_RESTART_34"
    FUEL_STOP = "FUEL_STOP"
    PICKUP = "PICKUP"
    DROPOFF = "DROPOFF"
    END_OFF_DUTY = "END_OFF_DUTY"


# FMCSA Standard Regulatory Thresholds in Integer Minutes
MAX_DRIVE_MINUTES = 11 * 60          # 660 mins (11 Hours) - 49 CFR § 395.3(a)(3)
MAX_DUTY_WINDOW_MINUTES = 14 * 60   # 840 mins (14 Hours) - 49 CFR § 395.3(a)(2)
MAX_CONTINUOUS_DRIVE_MINUTES = 8 * 60 # 480 mins (8 Hours) - 49 CFR § 395.3(a)(3)(ii)
MANDATORY_BREAK_MINUTES = 30         # 30 mins
RESET_SLEEPER_MINUTES = 10 * 60     # 600 mins (10 Hours) - 49 CFR § 395.3(a)(1)
RESTART_CYCLE_MINUTES = 34 * 60     # 2,040 mins (34 Hours) - 49 CFR § 395.3(c)
MAX_CYCLE_MINUTES = 70 * 60         # 4,200 mins (70 Hours / 8 Days) - 49 CFR § 395.3(b)(2)

# Operational Assumptions
MAX_FUEL_INTERVAL_MILES = 1000.0     # Must fuel at least once every 1,000 miles
FUEL_STOP_DURATION_MINUTES = 30      # 30 mins On-Duty Not Driving
PICKUP_DURATION_MINUTES = 60         # 1 hour On-Duty Not Driving at Shipper
DROPOFF_DURATION_MINUTES = 60        # 1 hour On-Duty Not Driving at Receiver


@dataclass
class TripEvent:
    event_id: str
    event_type: str
    duty_status: str
    start_minutes: int
    end_minutes: int
    duration_minutes: int
    start_time_iso: str
    end_time_iso: str
    route_distance_miles: float
    latitude: float
    longitude: float
    location_name: str
    remark: str
    counts_toward_drive: bool
    counts_toward_shift: bool
    counts_toward_cycle: bool
    segment_distance_miles: float = 0.0
    route_mile_marker: float = 0.0

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class RouteMilestone:
    name: str
    milestone_type: str  # 'DRIVE_LEG' or 'TASK'
    distance_miles: float
    duration_minutes: int
    start_coords: tuple
    end_coords: tuple
    location_name: str


def schedule_fmcsa_trip(
    milestones: List[RouteMilestone],
    current_cycle_used_minutes: int = 0,
    start_time_iso: Optional[str] = None,
    interpolate_coords_fn=None
) -> List[TripEvent]:
    """
    Generates an FMCSA HOS-aware trip schedule under the documented
    assessment assumptions.
    """
    if start_time_iso:
        try:
            base_time = datetime.fromisoformat(start_time_iso.replace('Z', '+00:00'))
        except Exception:
            base_time = datetime.now()
    else:
        base_time = datetime.now()

    # Normalize cycle used
    cycle_used = max(0, min(MAX_CYCLE_MINUTES, int(current_cycle_used_minutes)))

    current_minutes = 0
    cumulative_miles = 0.0
    miles_since_fuel = 0.0

    # HOS Clocks (all in minutes)
    drive_clock = 0          # 0..660
    shift_clock = 0          # 0..840
    continuous_drive_clock = 0  # 0..480 (since last >=30m non-driving break)

    events: List[TripEvent] = []
    event_seq = 1

    def make_event(
        event_type: EventType,
        duty_status: DutyStatus,
        duration: int,
        segment_miles: float,
        mile_marker: float,
        coords: tuple,
        loc_name: str,
        remark_text: str
    ) -> TripEvent:
        nonlocal event_seq, current_minutes
        start_min = current_minutes
        end_min = current_minutes + duration
        start_iso = (base_time + timedelta(minutes=start_min)).isoformat()
        end_iso = (base_time + timedelta(minutes=end_min)).isoformat()

        counts_drive = (duty_status == DutyStatus.DRIVING)
        # Shift window elapsed time is only counted during active shift events;
        # qualifying reset periods (10h sleeper reset, 34h restart, end off-duty) reset/conclude the shift.
        counts_shift = (event_type not in [
            EventType.SLEEPER_RESET_10,
            EventType.CYCLE_RESTART_34,
            EventType.END_OFF_DUTY
        ])
        counts_cycle = (duty_status in [DutyStatus.DRIVING, DutyStatus.ON_DUTY_NOT_DRIVING])

        evt = TripEvent(
            event_id=f"evt_{event_seq:03d}",
            event_type=event_type.value,
            duty_status=duty_status.value,
            start_minutes=start_min,
            end_minutes=end_min,
            duration_minutes=duration,
            start_time_iso=start_iso,
            end_time_iso=end_iso,
            route_distance_miles=round(mile_marker, 2),
            latitude=coords[0] if coords else 0.0,
            longitude=coords[1] if coords else 0.0,
            location_name=loc_name,
            remark=remark_text,
            counts_toward_drive=counts_drive,
            counts_toward_shift=counts_shift,
            counts_toward_cycle=counts_cycle,
            segment_distance_miles=round(segment_miles, 2),
            route_mile_marker=round(mile_marker, 2)
        )
        event_seq += 1
        current_minutes = end_min
        return evt

    def get_coords(target_miles: float, default_coords: tuple) -> tuple:
        if interpolate_coords_fn:
            res = interpolate_coords_fn(target_miles)
            if res:
                return res
        return default_coords

    # Process all route milestones (Drive to Pickup, Pickup, Drive to Dropoff, Dropoff)
    for ms in milestones:
        if ms.milestone_type == 'DRIVE_LEG':
            remaining_drive_mins = ms.duration_minutes
            remaining_leg_miles = ms.distance_miles
            leg_start_miles = cumulative_miles

            while remaining_drive_mins > 0:
                # 1. Calculate limits for each constraint
                avail_drive = MAX_DRIVE_MINUTES - drive_clock
                avail_shift = MAX_DUTY_WINDOW_MINUTES - shift_clock
                avail_break = MAX_CONTINUOUS_DRIVE_MINUTES - continuous_drive_clock
                avail_cycle = MAX_CYCLE_MINUTES - cycle_used

                # Fuel constraint in driving minutes
                if remaining_leg_miles > 0 and remaining_drive_mins > 0:
                    speed_mpm = remaining_leg_miles / remaining_drive_mins
                else:
                    speed_mpm = 0.8  # ~48 mph default fallback
                
                miles_avail_fuel = MAX_FUEL_INTERVAL_MILES - miles_since_fuel
                avail_fuel_mins = int(miles_avail_fuel / speed_mpm) if speed_mpm > 0 else 99999

                # Check if any hard limit has already been hit and must be resolved first
                if avail_cycle <= 0:
                    # No cycle driving capacity remains.
                    # Under the assessment's conservative planning model,
                    # schedule a 34-hour restart before further driving.
                    cur_coords = get_coords(cumulative_miles, ms.start_coords)
                    evt = make_event(
                        EventType.CYCLE_RESTART_34,
                        DutyStatus.SLEEPER_BERTH,
                        RESTART_CYCLE_MINUTES,
                        0.0,
                        cumulative_miles,
                        cur_coords,
                        f"Rest Area near {ms.location_name}",
                        "34-Hour Cycle Restart"
                    )
                    events.append(evt)
                    # Reset all HOS clocks
                    cycle_used = 0
                    drive_clock = 0
                    shift_clock = 0
                    continuous_drive_clock = 0
                    continue

                if avail_drive <= 0 or avail_shift <= 0:
                    # Daily driving/window capacity exhausted.
                    # Planner inserts a 10-hour sleeper/off-duty reset before further driving.
                    cur_coords = get_coords(cumulative_miles, ms.start_coords)
                    evt = make_event(
                        EventType.SLEEPER_RESET_10,
                        DutyStatus.SLEEPER_BERTH,
                        RESET_SLEEPER_MINUTES,
                        0.0,
                        cumulative_miles,
                        cur_coords,
                        f"Rest Area / Truck Stop near {ms.location_name}",
                        "10-Hour Off-Duty / Sleeper Reset"
                    )
                    events.append(evt)
                    # Reset 11h driving and 14h shift clocks
                    drive_clock = 0
                    shift_clock = 0
                    continuous_drive_clock = 0
                    continue

                if avail_break <= 0:
                    # 30-Minute Rest Break Required (after 8h continuous driving)
                    cur_coords = get_coords(cumulative_miles, ms.start_coords)
                    evt = make_event(
                        EventType.REST_BREAK_30,
                        DutyStatus.OFF_DUTY,
                        MANDATORY_BREAK_MINUTES,
                        0.0,
                        cumulative_miles,
                        cur_coords,
                        f"Rest Area near {ms.location_name}",
                        "Mandatory 30-Minute Rest Break"
                    )
                    events.append(evt)
                    # Off-duty break counts against 14h shift window, resets 8h break clock
                    shift_clock += MANDATORY_BREAK_MINUTES
                    continuous_drive_clock = 0
                    continue

                if avail_fuel_mins <= 0:
                    # Fuel Stop Required
                    cur_coords = get_coords(cumulative_miles, ms.start_coords)
                    evt = make_event(
                        EventType.FUEL_STOP,
                        DutyStatus.ON_DUTY_NOT_DRIVING,
                        FUEL_STOP_DURATION_MINUTES,
                        0.0,
                        cumulative_miles,
                        cur_coords,
                        f"Travel Center / Fuel Stop near {ms.location_name}",
                        "Fueling (30m On-Duty)"
                    )
                    events.append(evt)
                    # Fueling counts toward shift and cycle, and since it is >= 30m non-driving, resets break clock!
                    shift_clock += FUEL_STOP_DURATION_MINUTES
                    cycle_used += FUEL_STOP_DURATION_MINUTES
                    continuous_drive_clock = 0
                    miles_since_fuel = 0.0
                    continue

                # Determine maximum allowable driving step before hitting next event
                step_drive_mins = min(
                    remaining_drive_mins,
                    avail_drive,
                    avail_shift,
                    avail_break,
                    avail_cycle,
                    avail_fuel_mins
                )

                step_drive_mins = max(1, step_drive_mins)
                step_miles = step_drive_mins * speed_mpm
                step_miles = min(step_miles, remaining_leg_miles)

                # Drive Segment
                step_end_miles = cumulative_miles + step_miles
                step_coords = get_coords(step_end_miles, ms.end_coords)

                evt = make_event(
                    EventType.DRIVE_SEGMENT,
                    DutyStatus.DRIVING,
                    step_drive_mins,
                    step_miles,
                    step_end_miles,
                    step_coords,
                    ms.location_name,
                    f"Driving ({int(step_miles)} mi)"
                )
                events.append(evt)

                # Update trackers
                remaining_drive_mins -= step_drive_mins
                remaining_leg_miles -= step_miles
                cumulative_miles += step_miles
                miles_since_fuel += step_miles

                drive_clock += step_drive_mins
                shift_clock += step_drive_mins
                continuous_drive_clock += step_drive_mins
                cycle_used += step_drive_mins

        elif ms.milestone_type == 'TASK':
            # Non-driving task (Pickup or Dropoff)
            # Under FMCSA rules, the 70-hour cycle rule prohibits *driving* after reaching 70 hours.
            # On-duty non-driving work is permitted even if cycle_used exceeds 70 hours.
            task_duration = ms.duration_minutes

            # Execute task
            evt_type = EventType.PICKUP if "pickup" in ms.name.lower() else EventType.DROPOFF
            evt = make_event(
                evt_type,
                DutyStatus.ON_DUTY_NOT_DRIVING,
                task_duration,
                0.0,
                cumulative_miles,
                ms.start_coords,
                ms.location_name,
                ms.name
            )
            events.append(evt)

            cycle_used += task_duration
            shift_clock += task_duration
            # Any non-driving activity >= 30 mins (such as 60m pickup/dropoff) resets break clock!
            if task_duration >= MANDATORY_BREAK_MINUTES:
                continuous_drive_clock = 0

    return events

