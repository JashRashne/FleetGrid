from django.urls import path
from .views import (
    PlanTripView,
    HealthCheckView,
    QuickCitiesView,
    TripListCreateView,
    TripDetailView,
    LogsListView
)

urlpatterns = [
    path('health/', HealthCheckView.as_view(), name='api-health'),
    path('cities/', QuickCitiesView.as_view(), name='api-cities'),
    path('plan-trip/', PlanTripView.as_view(), name='api-plan-trip'),
    path('trips/', TripListCreateView.as_view(), name='api-trips-list'),
    path('trips/<uuid:trip_id>/', TripDetailView.as_view(), name='api-trip-detail'),
    path('logs/', LogsListView.as_view(), name='api-logs-list'),
]
