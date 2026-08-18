from rest_framework import serializers
from .models import Trip, DailyLog


class PlanTripRequestSerializer(serializers.Serializer):
    current_location = serializers.CharField(
        required=True,
        allow_blank=False,
        max_length=200,
        help_text="Starting location of the truck/driver (e.g. Chicago, IL)"
    )
    pickup_location = serializers.CharField(
        required=True,
        allow_blank=False,
        max_length=200,
        help_text="Shipper / Pickup location (e.g. Indianapolis, IN)"
    )
    dropoff_location = serializers.CharField(
        required=True,
        allow_blank=False,
        max_length=200,
        help_text="Receiver / Dropoff location (e.g. Atlanta, GA)"
    )
    current_cycle_used_hours = serializers.FloatField(
        required=True,
        min_value=0.0,
        max_value=70.0,
        help_text="Accumulated on-duty hours in current 70hr/8day cycle (0 to 70)"
    )
    departure_time = serializers.CharField(
        required=False,
        default=None,
        allow_null=True,
        help_text="Optional ISO 8601 departure timestamp"
    )


class DailyLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyLog
        fields = [
            'id', 'day_number', 'log_date', 'driver_name',
            'carrier_name', 'truck_id', 'total_driving_hours',
            'total_on_duty_hours', 'total_off_duty_hours',
            'total_sleeper_hours', 'is_fmcsa_compliant',
            'grid_intervals_json', 'remarks_json', 'recap_json'
        ]


class TripListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Trip
        fields = [
            'id', 'created_at', 'origin_name', 'pickup_name',
            'dropoff_name', 'total_distance_miles', 'total_drive_time_hours',
            'total_trip_duration_hours', 'days_required', 'fuel_stops_count',
            'summary_json', 'locations_json'
        ]


class TripDetailSerializer(serializers.ModelSerializer):
    daily_logs = serializers.SerializerMethodField()

    class Meta:
        model = Trip
        fields = [
            'id', 'created_at', 'origin_name', 'pickup_name',
            'dropoff_name', 'current_cycle_used_hours', 'departure_time',
            'total_distance_miles', 'total_drive_time_hours',
            'total_trip_duration_hours', 'days_required', 'fuel_stops_count',
            'summary_json', 'locations_json', 'route_geometry_json',
            'events_json', 'turn_by_turn_steps_json', 'daily_logs', 'disclaimers_json'
        ]

    def get_daily_logs(self, obj):
        return [log.to_dict() for log in obj.logs.all()]
