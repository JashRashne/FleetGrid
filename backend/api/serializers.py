from rest_framework import serializers


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
