"""
FMCSA Driver's Daily Log Sheet Generator.
Slices continuous TripEvents into 24-hour (1,440-minute) daily grids faithful to FMCSA regulations and blank-paper-log.png.
"""

from datetime import datetime, timedelta
from typing import List, Dict, Any
from .hos_engine import TripEvent, DutyStatus, EventType


MINUTES_PER_DAY = 24 * 60  # 1,440 minutes


def generate_daily_log_sheets(
    events: List[TripEvent],
    start_time_iso: str,
    initial_cycle_used_minutes: int,
    carrier_name: str = "MileMint Logistics LLC",
    driver_name: str = "Alex Morgan",
    truck_number: str = "TRK-9042",
    trailer_number: str = "TLR-5510",
    origin_name: str = "",
    pickup_name: str = "",
    destination_name: str = "",
) -> List[Dict[str, Any]]:
    """
    Slices the continuous event stream at midnight boundaries into 24-hour log sheet datasets.
    Guarantees every day sheet has exactly 1,440 minutes (24.0 hours).
    """
    if not events:
        return []

    try:
        trip_start_dt = datetime.fromisoformat(start_time_iso.replace('Z', '+00:00'))
    except Exception:
        trip_start_dt = datetime.now()

    # Determine start-of-day for Day 1 (Midnight 00:00:00 of the departure date)
    day1_midnight = trip_start_dt.replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Pre-trip offset: minutes from Day 1 midnight until departure
    departure_offset_minutes = int((trip_start_dt - day1_midnight).total_seconds() / 60)
    if departure_offset_minutes < 0:
        departure_offset_minutes = 0

    total_trip_duration_minutes = events[-1].end_minutes if events else 0
    total_timeline_span_minutes = departure_offset_minutes + total_trip_duration_minutes
    num_days = max(1, (total_timeline_span_minutes + MINUTES_PER_DAY - 1) // MINUTES_PER_DAY)

    # Construct unified continuous timeline from Day 1 00:00
    timeline_segments = []

    # 1. Fill pre-trip time on Day 1 with OFF_DUTY
    if departure_offset_minutes > 0:
        timeline_segments.append({
            "duty_status": DutyStatus.OFF_DUTY.value,
            "event_type": EventType.START.value,
            "start_min": 0,
            "end_min": departure_offset_minutes,
            "duration": departure_offset_minutes,
            "remark": "Off Duty Prior to Dispatch",
            "location": events[0].location_name if events else "Origin Terminal",
            "miles_driven": 0.0
        })

    # 2. Add all trip events
    for evt in events:
        s_min = departure_offset_minutes + evt.start_minutes
        e_min = departure_offset_minutes + evt.end_minutes
        dur = evt.duration_minutes
        miles = evt.segment_distance_miles if evt.duty_status == DutyStatus.DRIVING.value else 0.0

        timeline_segments.append({
            "duty_status": evt.duty_status,
            "event_type": evt.event_type,
            "start_min": s_min,
            "end_min": e_min,
            "duration": dur,
            "remark": evt.remark,
            "location": evt.location_name,
            "miles_driven": miles,
        })

    # 3. Post-trip time to complete the last day's 24 hours with OFF_DUTY
    last_end = timeline_segments[-1]["end_min"] if timeline_segments else 0
    full_span_needed = num_days * MINUTES_PER_DAY
    if last_end < full_span_needed:
        timeline_segments.append({
            "duty_status": DutyStatus.OFF_DUTY.value,
            "event_type": EventType.END_OFF_DUTY.value,
            "start_min": last_end,
            "end_min": full_span_needed,
            "duration": full_span_needed - last_end,
            "remark": "Off Duty Post-Trip",
            "location": events[-1].location_name if events else "Destination",
            "miles_driven": 0.0
        })

    # Now slice timeline_segments into per-day 1,440-minute blocks
    daily_logs = []
    running_cycle_mins = initial_cycle_used_minutes

    for day_idx in range(num_days):
        day_num = day_idx + 1
        day_start_min = day_idx * MINUTES_PER_DAY
        day_end_min = day_start_min + MINUTES_PER_DAY
        current_day_date = (day1_midnight + timedelta(days=day_idx)).strftime("%Y-%m-%d")

        day_segments = []
        day_remarks = []
        day_miles_driven = 0.0
        cycle_at_day_start = running_cycle_mins

        for seg in timeline_segments:
            # Check if this segment intersects this day's [day_start_min, day_end_min]
            seg_s = seg["start_min"]
            seg_e = seg["end_min"]

            if seg_e <= day_start_min or seg_s >= day_end_min:
                continue  # No overlap

            # Clip segment to day boundary
            clipped_s = max(seg_s, day_start_min) - day_start_min
            clipped_e = min(seg_e, day_end_min) - day_start_min
            clipped_dur = clipped_e - clipped_s

            if clipped_dur <= 0:
                continue

            seg_total_dur = seg_e - seg_s
            seg_fraction = clipped_dur / seg_total_dur if seg_total_dur > 0 else 1.0
            seg_clipped_miles = seg.get("miles_driven", 0.0) * seg_fraction

            day_segments.append({
                "duty_status": seg["duty_status"],
                "start_hour": round(clipped_s / 60.0, 3),
                "end_hour": round(clipped_e / 60.0, 3),
                "start_minute": clipped_s,
                "end_minute": clipped_e,
                "duration_minutes": clipped_dur,
                "duration_hours": round(clipped_dur / 60.0, 2),
                "miles_driven": round(seg_clipped_miles, 2)
            })

            # Add remark at start of duty status change if it occurs on this day
            if seg_s >= day_start_min and seg_s < day_end_min:
                rem_hour = round((seg_s - day_start_min) / 60.0, 2)
                day_remarks.append({
                    "time_hour": rem_hour,
                    "location": seg["location"],
                    "text": seg["remark"],
                    "duty_status": seg["duty_status"]
                })

            if seg["duty_status"] == DutyStatus.DRIVING.value:
                day_miles_driven += seg_clipped_miles

            # Chronological cycle tracking:
            # A 34-hour restart resets the cycle only when it completes (at seg_e)
            if seg.get("event_type") == EventType.CYCLE_RESTART_34.value:
                if day_start_min < seg_e <= day_end_min:
                    running_cycle_mins = 0
            elif seg["duty_status"] in (DutyStatus.DRIVING.value, DutyStatus.ON_DUTY_NOT_DRIVING.value):
                running_cycle_mins += clipped_dur

        # Calculate exact totals for the 4 status rows
        totals = {
            "off_duty_minutes": 0,
            "sleeper_berth_minutes": 0,
            "driving_minutes": 0,
            "on_duty_not_driving_minutes": 0
        }

        for s in day_segments:
            st = s["duty_status"]
            dur = s["duration_minutes"]
            if st == DutyStatus.OFF_DUTY.value:
                totals["off_duty_minutes"] += dur
            elif st == DutyStatus.SLEEPER_BERTH.value:
                totals["sleeper_berth_minutes"] += dur
            elif st == DutyStatus.DRIVING.value:
                totals["driving_minutes"] += dur
            elif st == DutyStatus.ON_DUTY_NOT_DRIVING.value:
                totals["on_duty_not_driving_minutes"] += dur

        # Strict chronological continuity and duration integrity checks
        if not day_segments:
            raise ValueError(f"Daily log integrity failure for Day {day_num}: no segments generated.")

        if day_segments[0]["start_minute"] != 0:
            raise ValueError(
                f"Daily log integrity failure for Day {day_num}: "
                f"first segment starts at minute {day_segments[0]['start_minute']}, expected 0."
            )

        for idx in range(len(day_segments)):
            cur_seg = day_segments[idx]
            if cur_seg["duration_minutes"] <= 0:
                raise ValueError(
                    f"Daily log integrity failure for Day {day_num}: "
                    f"segment {idx} has non-positive duration {cur_seg['duration_minutes']}."
                )
            if cur_seg["start_minute"] >= cur_seg["end_minute"]:
                raise ValueError(
                    f"Daily log integrity failure for Day {day_num}: "
                    f"segment {idx} start_minute {cur_seg['start_minute']} >= end_minute {cur_seg['end_minute']}."
                )
            if cur_seg["duration_minutes"] != (cur_seg["end_minute"] - cur_seg["start_minute"]):
                raise ValueError(
                    f"Daily log integrity failure for Day {day_num}: "
                    f"segment {idx} duration_minutes {cur_seg['duration_minutes']} != "
                    f"(end_minute {cur_seg['end_minute']} - start_minute {cur_seg['start_minute']})."
                )
            if idx > 0:
                prev_seg = day_segments[idx - 1]
                if prev_seg["end_minute"] != cur_seg["start_minute"]:
                    raise ValueError(
                        f"Daily log integrity failure for Day {day_num}: "
                        f"gap or overlap detected between segment {idx-1} (end {prev_seg['end_minute']}) "
                        f"and segment {idx} (start {cur_seg['start_minute']})."
                    )

        if day_segments[-1]["end_minute"] != MINUTES_PER_DAY:
            raise ValueError(
                f"Daily log integrity failure for Day {day_num}: "
                f"last segment ends at minute {day_segments[-1]['end_minute']}, expected {MINUTES_PER_DAY}."
            )

        sum_segment_durations = sum(s["duration_minutes"] for s in day_segments)
        if sum_segment_durations != MINUTES_PER_DAY:
            raise ValueError(
                f"Daily log integrity failure for Day {day_num}: "
                f"sum of segment durations {sum_segment_durations} != {MINUTES_PER_DAY}."
            )

        total_day_minutes = sum(totals.values())
        if total_day_minutes != MINUTES_PER_DAY:
            raise ValueError(
                f"Daily log integrity failure for Day {day_num}: "
                f"sum of duty status totals {total_day_minutes} != {MINUTES_PER_DAY}."
            )

        # On-duty today = driving + on-duty not driving
        on_duty_today_mins = totals["driving_minutes"] + totals["on_duty_not_driving_minutes"]
        cumulative_cycle_mins = running_cycle_mins
        avail_tomorrow_mins = max(0, (70 * 60) - cumulative_cycle_mins)
        cycle_at_start_mins = cycle_at_day_start

        route_stops = [name for name in (origin_name, pickup_name, destination_name) if name]
        trip_route = " -> ".join(dict.fromkeys(route_stops))
        first_location = origin_name or (day_remarks[0]["location"] if day_remarks else "")
        last_location = destination_name or (day_remarks[-1]["location"] if day_remarks else first_location)

        daily_logs.append({
            "day_number": day_num,
            "date": current_day_date,
            "carrier_name": carrier_name,
            "main_office_address": "100 Logistics Blvd, Suite 400, Chicago, IL",
            "home_terminal_address": "770 Freight Way, Chicago, IL",
            "driver_name": driver_name,
            "truck_number": truck_number,
            "trailer_number": trailer_number,
            "from_location": first_location,
            "to_location": last_location,
            "pickup_location": pickup_name,
            "trip_route": trip_route,
            "total_miles_driving_today": round(day_miles_driven, 1),
            "segments": day_segments,
            "totals_hours": {
                "off_duty": round(totals["off_duty_minutes"] / 60.0, 2),
                "sleeper_berth": round(totals["sleeper_berth_minutes"] / 60.0, 2),
                "driving": round(totals["driving_minutes"] / 60.0, 2),
                "on_duty_not_driving": round(totals["on_duty_not_driving_minutes"] / 60.0, 2),
                "total": 24.0
            },
            "remarks": day_remarks,
            "recap": {
                "on_duty_today_hours": round(on_duty_today_mins / 60.0, 2),
                "cycle_hours_at_start": round(cycle_at_start_mins / 60.0, 2),
                "cycle_hours_cumulative": round(cumulative_cycle_mins / 60.0, 2),
                "cycle_hours_remaining": round(avail_tomorrow_mins / 60.0, 2)
            }
        })

    return daily_logs

