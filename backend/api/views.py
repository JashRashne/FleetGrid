from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from datetime import datetime
from django.shortcuts import get_object_or_404

from .models import Trip, DailyLog
from .serializers import (
    PlanTripRequestSerializer,
    TripListSerializer,
    TripDetailSerializer,
    DailyLogSerializer
)
from .services.geocoding import geocode_location, reverse_geocode, US_CITY_COORDINATES
from .services.routing import get_osrm_route, create_route_interpolator
from .services.hos_engine import (
    schedule_fmcsa_trip,
    RouteMilestone,
    PICKUP_DURATION_MINUTES,
    DROPOFF_DURATION_MINUTES,
    DutyStatus,
    EventType
)
from .services.log_generator import generate_daily_log_sheets


class HealthCheckView(APIView):
    def get(self, request):
        return Response({
            "status": "ok",
            "service": "FMCSA ELD Trip Planner API",
            "version": "1.0.0",
            "timestamp": datetime.utcnow().isoformat() + "Z"
        })


class QuickCitiesView(APIView):
    def get(self, request):
        cities = [
            {"name": "Chicago, IL", "display": "Chicago, IL"},
            {"name": "Indianapolis, IN", "display": "Indianapolis, IN"},
            {"name": "Atlanta, GA", "display": "Atlanta, GA"},
            {"name": "Dallas, TX", "display": "Dallas, TX"},
            {"name": "Los Angeles, CA", "display": "Los Angeles, CA"},
            {"name": "New York, NY", "display": "New York, NY"},
            {"name": "Columbus, OH", "display": "Columbus, OH"},
            {"name": "Nashville, TN", "display": "Nashville, TN"},
            {"name": "Denver, CO", "display": "Denver, CO"},
            {"name": "Phoenix, AZ", "display": "Phoenix, AZ"},
            {"name": "Seattle, WA", "display": "Seattle, WA"},
            {"name": "Houston, TX", "display": "Houston, TX"},
            {"name": "Miami, FL", "display": "Miami, FL"},
        ]
        return Response({"cities": cities})


class PlanTripView(APIView):
    def post(self, request):
        serializer = PlanTripRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"status": "error", "errors": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        data = serializer.validated_data
        curr_loc_str = data["current_location"]
        pickup_loc_str = data["pickup_location"]
        dropoff_loc_str = data["dropoff_location"]
        cycle_used_hours = data["current_cycle_used_hours"]
        start_time_iso = data.get("departure_time") or datetime.utcnow().isoformat() + "Z"

        # 1. Geocode locations
        try:
            curr_lat, curr_lon, curr_name = geocode_location(curr_loc_str)
            pick_lat, pick_lon, pick_name = geocode_location(pickup_loc_str)
            drop_lat, drop_lon, drop_name = geocode_location(dropoff_loc_str)
        except Exception as e:
            return Response(
                {"status": "error", "message": f"Geocoding error: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 2. Get OSRM route for Leg 1 (Current -> Pickup) and Leg 2 (Pickup -> Dropoff)
        try:
            leg1 = get_osrm_route((curr_lat, curr_lon), (pick_lat, pick_lon))
            leg2 = get_osrm_route((pick_lat, pick_lon), (drop_lat, drop_lon))
        except Exception as e:
            return Response(
                {"status": "error", "message": f"Routing error: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        leg1_miles = leg1["distance_miles"]
        leg2_miles = leg2["distance_miles"]
        total_route_miles = round(leg1_miles + leg2_miles, 1)

        leg1_coords = leg1["geometry"]["coordinates"] if isinstance(leg1["geometry"], dict) else leg1["geometry"]
        leg2_coords = leg2["geometry"]["coordinates"] if isinstance(leg2["geometry"], dict) else leg2["geometry"]
        merged_coords = leg1_coords + leg2_coords
        interpolator = create_route_interpolator(merged_coords, total_route_miles)

        # 3. Build Milestones for HOS engine
        milestones = [
            RouteMilestone(
                name=f"Drive to Shipper ({curr_name} → {pick_name})",
                milestone_type="DRIVE_LEG",
                distance_miles=leg1_miles,
                duration_minutes=leg1["duration_minutes"],
                start_coords=(curr_lat, curr_lon),
                end_coords=(pick_lat, pick_lon),
                location_name=f"{curr_name} to {pick_name}"
            ),
            RouteMilestone(
                name=f"Pickup loading at Shipper ({pick_name})",
                milestone_type="TASK",
                distance_miles=0.0,
                duration_minutes=PICKUP_DURATION_MINUTES,
                start_coords=(pick_lat, pick_lon),
                end_coords=(pick_lat, pick_lon),
                location_name=pick_name
            ),
            RouteMilestone(
                name=f"Drive to Receiver ({pick_name} → {drop_name})",
                milestone_type="DRIVE_LEG",
                distance_miles=leg2_miles,
                duration_minutes=leg2["duration_minutes"],
                start_coords=(pick_lat, pick_lon),
                end_coords=(drop_lat, drop_lon),
                location_name=f"{pick_name} to {drop_name}"
            ),
            RouteMilestone(
                name=f"Dropoff unloading at Receiver ({drop_name})",
                milestone_type="TASK",
                distance_miles=0.0,
                duration_minutes=DROPOFF_DURATION_MINUTES,
                start_coords=(drop_lat, drop_lon),
                end_coords=(drop_lat, drop_lon),
                location_name=drop_name
            )
        ]

        # 4. Schedule FMCSA Compliant Events
        initial_cycle_used_minutes = int(cycle_used_hours * 60)
        events = schedule_fmcsa_trip(
            milestones=milestones,
            current_cycle_used_minutes=initial_cycle_used_minutes,
            start_time_iso=start_time_iso,
            interpolate_coords_fn=interpolator
        )

        # 5. Generate 24-Hour ELD Daily Log Sheets
        initial_cycle_used_minutes = int(cycle_used_hours * 60)
        driver_name = request.data.get("driver_name") or "Alex Morgan"
        carrier_name = request.data.get("carrier_name") or "MileMint Logistics LLC"
        truck_number = request.data.get("truck_number") or "TRK-9042"
        daily_logs = generate_daily_log_sheets(
            events=events,
            start_time_iso=start_time_iso,
            initial_cycle_used_minutes=initial_cycle_used_minutes,
            carrier_name=carrier_name,
            driver_name=driver_name,
            truck_number=truck_number,
            trailer_number="TLR-5510",
            origin_name=curr_name,
            pickup_name=pick_name,
            destination_name=drop_name,
        )

        # 6. Calculate comprehensive KPI summary
        total_drive_mins = sum(e.duration_minutes for e in events if e.duty_status == DutyStatus.DRIVING.value)
        total_trip_mins = events[-1].end_minutes if events else 0
        total_on_duty_mins = sum(e.duration_minutes for e in events if e.duty_status in [DutyStatus.DRIVING.value, DutyStatus.ON_DUTY_NOT_DRIVING.value])
        
        fuel_stops_count = sum(1 for e in events if e.event_type == EventType.FUEL_STOP.value)
        rest_breaks_count = sum(1 for e in events if e.event_type == EventType.REST_BREAK_30.value)
        sleeper_resets_count = sum(1 for e in events if e.event_type == EventType.SLEEPER_RESET_10.value)
        cycle_restarts_count = sum(1 for e in events if e.event_type == EventType.CYCLE_RESTART_34.value)

        running_cycle_end = initial_cycle_used_minutes
        for e in events:
            if e.event_type == EventType.CYCLE_RESTART_34.value:
                running_cycle_end = 0
            elif e.duty_status in [DutyStatus.DRIVING.value, DutyStatus.ON_DUTY_NOT_DRIVING.value]:
                running_cycle_end += e.duration_minutes

        cycle_added_hours = round(total_on_duty_mins / 60.0, 2)
        ending_cycle_hours = round(running_cycle_end / 60.0, 2)
        remaining_cycle_hours = round(max(0.0, 70.0 - ending_cycle_hours), 2)

        # Fuel estimations
        estimated_gallons = round(total_route_miles / 6.5, 1)
        estimated_fuel_cost = round(estimated_gallons * 3.80, 2)

        merged_steps = []
        if leg1.get("steps"):
            merged_steps.extend(leg1["steps"])
        merged_steps.append({"instruction": f"Arrived at Shipper in {pick_name} (1-hour On-Duty Pickup)", "distance_miles": 0, "duration_minutes": 60})
        if leg2.get("steps"):
            merged_steps.extend(leg2["steps"])
        merged_steps.append({"instruction": f"Arrived at Receiver in {drop_name} (1-hour On-Duty Dropoff)", "distance_miles": 0, "duration_minutes": 60})

        summary_payload = {
            "total_distance_miles": total_route_miles,
            "total_miles": total_route_miles,
            "total_drive_time_minutes": total_drive_mins,
            "total_drive_time_hours": round(total_drive_mins / 60.0, 2),
            "driving_hours": round(total_drive_mins / 60.0, 2),
            "total_trip_duration_minutes": total_trip_mins,
            "total_trip_duration_hours": round(total_trip_mins / 60.0, 2),
            "total_duration_hours": round(total_trip_mins / 60.0, 2),
            "total_fuel_stops": fuel_stops_count,
            "fuel_stops_count": fuel_stops_count,
            "total_rest_breaks": rest_breaks_count,
            "total_sleeper_resets": sleeper_resets_count,
            "total_cycle_restarts": cycle_restarts_count,
            "cycle_hours_at_start": round(cycle_used_hours, 2),
            "cycle_hours_added": cycle_added_hours,
            "cycle_hours_ending": ending_cycle_hours,
            "cycle_hours_remaining": remaining_cycle_hours,
            "days_required": len(daily_logs),
            "estimated_fuel_gallons": estimated_gallons,
            "estimated_fuel_cost": estimated_fuel_cost,
            "is_compliant": True
        }

        locations_payload = {
            "current": {"name": curr_name, "lat": curr_lat, "lng": curr_lon},
            "pickup": {"name": pick_name, "lat": pick_lat, "lng": pick_lon},
            "dropoff": {"name": drop_name, "lat": drop_lat, "lng": drop_lon}
        }

        geometry_payload = {
            "type": "LineString",
            "coordinates": merged_coords
        }

        disclaimers_payload = {
            "routing": "Route generated with OpenStreetMap road data. For commercial vehicles, please verify clearance, bridge weight, and hazmat restrictions.",
            "recap": "Conservative cycle calculation assuming no prior hours drop off in the rolling window.",
            "attribution": "Routing data © OpenStreetMap contributors, OSRM Project."
        }

        events_payload = [e.to_dict() for e in events]

        # 7. Persist to Database
        try:
            trip_obj = Trip.objects.create(
                origin_name=curr_name,
                pickup_name=pick_name,
                dropoff_name=drop_name,
                current_cycle_used_hours=cycle_used_hours,
                departure_time=start_time_iso,
                total_distance_miles=total_route_miles,
                total_drive_time_hours=round(total_drive_mins / 60.0, 2),
                total_trip_duration_hours=round(total_trip_mins / 60.0, 2),
                days_required=len(daily_logs),
                fuel_stops_count=fuel_stops_count,
                summary_json=summary_payload,
                locations_json=locations_payload,
                route_geometry_json=geometry_payload,
                events_json=events_payload,
                turn_by_turn_steps_json=merged_steps,
                disclaimers_json=disclaimers_payload
            )

            # Persist Daily Logs
            for log_data in daily_logs:
                DailyLog.objects.create(
                    trip=trip_obj,
                    day_number=log_data.get("day_number", 1),
                    log_date=log_data.get("date", "Day 1"),
                    driver_name=log_data.get("driver_name", "Alex Morgan"),
                    carrier_name=log_data.get("carrier_name", "MileMint Logistics LLC"),
                    truck_id=log_data.get("truck_number") or log_data.get("truck_id", "TRK-9042"),
                    total_driving_hours=log_data.get("totals_hours", {}).get("driving", 0.0) or log_data.get("totals", {}).get("DRIVING", 0.0),
                    total_on_duty_hours=log_data.get("totals_hours", {}).get("on_duty_not_driving", 0.0) or log_data.get("totals", {}).get("ON_DUTY_NOT_DRIVING", 0.0),
                    total_off_duty_hours=log_data.get("totals_hours", {}).get("off_duty", 0.0) or log_data.get("totals", {}).get("OFF_DUTY", 0.0),
                    total_sleeper_hours=log_data.get("totals_hours", {}).get("sleeper_berth", 0.0) or log_data.get("totals", {}).get("SLEEPER_BERTH", 0.0),
                    is_fmcsa_compliant=True,
                    log_data_json=log_data,
                    grid_intervals_json=log_data.get("segments", []),
                    remarks_json=log_data.get("remarks", []),
                    recap_json=log_data.get("recap", {})
                )

            trip_id_str = str(trip_obj.id)
            created_at_iso = trip_obj.created_at.isoformat()
        except Exception:
            trip_id_str = f"trip_{int(datetime.utcnow().timestamp())}"
            created_at_iso = datetime.utcnow().isoformat() + "Z"

        response_payload = {
            "id": trip_id_str,
            "created_at": created_at_iso,
            "status": "success",
            "summary": summary_payload,
            "locations": locations_payload,
            "route_geometry": geometry_payload,
            "turn_by_turn_steps": merged_steps,
            "events": events_payload,
            "daily_logs": daily_logs,
            "disclaimers": disclaimers_payload
        }

        return Response(response_payload, status=status.HTTP_200_OK)


class TripListCreateView(APIView):
    """List all saved trips or create a new trip record."""
    def get(self, request):
        trips = Trip.objects.all().order_by('-created_at')
        return Response({"trips": [trip.to_frontend_dict() for trip in trips]}, status=status.HTTP_200_OK)


class TripDetailView(APIView):
    """Retrieve or delete a specific trip by its UUID."""
    def get(self, request, trip_id):
        trip = get_object_or_404(Trip, id=trip_id)
        return Response(trip.to_frontend_dict(), status=status.HTTP_200_OK)

    def delete(self, request, trip_id):
        trip = get_object_or_404(Trip, id=trip_id)
        trip.delete()
        return Response({"status": "deleted", "id": str(trip_id)}, status=status.HTTP_200_OK)


class LogsListView(APIView):
    """Fetch all daily log sheets across all trips for the driver logs hub."""
    def get(self, request):
        logs = DailyLog.objects.select_related('trip').all().order_by('-created_at', 'day_number')
        result = []
        for log in logs:
            log_dict = log.to_dict()
            log_dict["trip_id"] = str(log.trip_id)
            if log.trip:
                log_dict["trip_route"] = f"{log.trip.origin_name} → {log.trip.dropoff_name}"
            
            # Recalculate exact hours from segments if needed
            segments = log_dict.get("segments") or log_dict.get("duty_segments") or log.grid_intervals_json or []
            if segments:
                drive_mins = 0
                on_duty_mins = 0
                off_duty_mins = 0
                sleeper_mins = 0
                miles_today = 0.0

                for seg in segments:
                    dur_mins = max(0, (seg.get("end_hour", 0) - seg.get("start_hour", 0)) * 60) if "start_hour" in seg else max(0, seg.get("end_min", 0) - seg.get("start_min", 0))
                    status = str(seg.get("duty_status", "")).upper()
                    remark = str(seg.get("remark", "")).upper()
                    combined = f"{status} {remark}"
                    miles_today += float(seg.get("miles_driven", 0) or seg.get("distance_miles", 0) or 0)

                    if "DRIV" in combined:
                        drive_mins += dur_mins
                    elif any(k in combined for k in ["ON_DUTY", "ON DUTY", "LOAD", "PICKUP", "UNLOAD", "INSPECT", "FUEL"]):
                        on_duty_mins += dur_mins
                    elif "SLEEP" in combined:
                        sleeper_mins += dur_mins
                    else:
                        off_duty_mins += dur_mins

                log_dict["totals_hours"] = {
                    "driving": round(drive_mins / 60.0, 1),
                    "on_duty_not_driving": round(on_duty_mins / 60.0, 1),
                    "off_duty": round(off_duty_mins / 60.0, 1),
                    "sleeper_berth": round(sleeper_mins / 60.0, 1),
                    "total": 24.0
                }
                if miles_today > 0:
                    log_dict["total_miles_driving_today"] = round(miles_today, 1)
            else:
                # No segments — fall back to model's stored hour fields directly
                stored_driving = log.total_driving_hours or 0.0
                stored_on_duty = log.total_on_duty_hours or 0.0
                stored_off_duty = log.total_off_duty_hours or 0.0
                stored_sleeper = log.total_sleeper_hours or 0.0

                # If model fields are also all zero, try reading from log_data_json totals
                if stored_driving == 0 and stored_on_duty == 0:
                    existing_totals = log_dict.get("totals_hours", {})
                    stored_driving = existing_totals.get("driving", 0.0)
                    stored_on_duty = existing_totals.get("on_duty_not_driving", 0.0)
                    stored_off_duty = existing_totals.get("off_duty", 0.0)
                    stored_sleeper = existing_totals.get("sleeper_berth", 0.0)

                log_dict["totals_hours"] = {
                    "driving": round(stored_driving, 1),
                    "on_duty_not_driving": round(stored_on_duty, 1),
                    "off_duty": round(stored_off_duty, 1),
                    "sleeper_berth": round(stored_sleeper, 1),
                    "total": 24.0
                }
                # Also expose flat fields for frontend compatibility
                log_dict["total_driving_hours"] = round(stored_driving, 1)
                log_dict["total_on_duty_hours"] = round(stored_on_duty, 1)

            # Ensure driver and carrier match current driver profile
            if not log_dict.get("driver_name") or "Alex Mercer" in log_dict.get("driver_name", ""):
                log_dict["driver_name"] = "Alex Morgan"
            if not log_dict.get("carrier_name") or "Apex Freight" in log_dict.get("carrier_name", ""):
                log_dict["carrier_name"] = "MileMint Logistics LLC"

            result.append(log_dict)
        return Response({"logs": result}, status=status.HTTP_200_OK)
