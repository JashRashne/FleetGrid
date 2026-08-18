import uuid
from django.db import models


class Trip(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    origin_name = models.CharField(max_length=255)
    pickup_name = models.CharField(max_length=255)
    dropoff_name = models.CharField(max_length=255)
    
    current_cycle_used_hours = models.FloatField(default=0.0)
    departure_time = models.CharField(max_length=100, blank=True, null=True)
    
    total_distance_miles = models.FloatField(default=0.0)
    total_drive_time_hours = models.FloatField(default=0.0)
    total_trip_duration_hours = models.FloatField(default=0.0)
    days_required = models.IntegerField(default=1)
    fuel_stops_count = models.IntegerField(default=0)
    
    summary_json = models.JSONField(default=dict)
    locations_json = models.JSONField(default=dict)
    route_geometry_json = models.JSONField(default=dict)
    events_json = models.JSONField(default=list)
    turn_by_turn_steps_json = models.JSONField(default=list)
    disclaimers_json = models.JSONField(default=dict)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.origin_name} -> {self.pickup_name} -> {self.dropoff_name} ({self.total_distance_miles} mi)"

    def to_frontend_dict(self):
        return {
            "id": str(self.id),
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "status": "success",
            "summary": self.summary_json or {
                "total_distance_miles": self.total_distance_miles,
                "total_drive_time_hours": self.total_drive_time_hours,
                "total_trip_duration_hours": self.total_trip_duration_hours,
                "days_required": self.days_required,
                "total_fuel_stops": self.fuel_stops_count
            },
            "locations": self.locations_json,
            "route_geometry": self.route_geometry_json,
            "turn_by_turn_steps": self.turn_by_turn_steps_json,
            "events": self.events_json,
            "daily_logs": [log.to_dict() for log in self.logs.all()],
            "disclaimers": self.disclaimers_json
        }


class DailyLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name='logs')
    created_at = models.DateTimeField(auto_now_add=True)
    
    day_number = models.IntegerField(default=1)
    log_date = models.CharField(max_length=50)
    driver_name = models.CharField(max_length=150, default="Alex Morgan")
    carrier_name = models.CharField(max_length=200, default="MileMint Logistics LLC")
    truck_id = models.CharField(max_length=50, default="TRK-9042")
    
    total_driving_hours = models.FloatField(default=0.0)
    total_on_duty_hours = models.FloatField(default=0.0)
    total_off_duty_hours = models.FloatField(default=0.0)
    total_sleeper_hours = models.FloatField(default=0.0)
    is_fmcsa_compliant = models.BooleanField(default=True)
    
    grid_intervals_json = models.JSONField(default=list)
    remarks_json = models.JSONField(default=list)
    recap_json = models.JSONField(default=dict)

    class Meta:
        ordering = ['day_number']

    def __str__(self):
        return f"Log Day {self.day_number} - {self.log_date} ({self.driver_name})"

    def to_dict(self):
        return {
            "id": str(self.id),
            "day_number": self.day_number,
            "date": self.log_date,
            "driver_name": self.driver_name,
            "carrier_name": self.carrier_name,
            "truck_id": self.truck_id,
            "totals": {
                "OFF_DUTY": self.total_off_duty_hours,
                "SLEEPER_BERTH": self.total_sleeper_hours,
                "DRIVING": self.total_driving_hours,
                "ON_DUTY_NOT_DRIVING": self.total_on_duty_hours,
                "total_on_duty": round(self.total_driving_hours + self.total_on_duty_hours, 2),
                "is_compliant": self.is_fmcsa_compliant
            },
            "duty_intervals": self.grid_intervals_json,
            "duty_segments": self.grid_intervals_json,
            "remarks": self.remarks_json,
            "recap": self.recap_json
        }
