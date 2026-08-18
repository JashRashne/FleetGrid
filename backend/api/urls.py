from django.urls import path
from .views import PlanTripView, HealthCheckView, QuickCitiesView

urlpatterns = [
    path('health/', HealthCheckView.as_view(), name='api-health'),
    path('cities/', QuickCitiesView.as_view(), name='api-cities'),
    path('plan-trip/', PlanTripView.as_view(), name='api-plan-trip'),
]
