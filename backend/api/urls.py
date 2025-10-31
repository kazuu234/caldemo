from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TripViewSet, NotificationViewSet, CommentViewSet, DateProposalViewSet

router = DefaultRouter()
router.register(r"trips", TripViewSet, basename="trip")
router.register(r"notifications", NotificationViewSet, basename="notification")
router.register(r"comments", CommentViewSet, basename="comment")
router.register(r"date_proposals", DateProposalViewSet, basename="dateproposal")

urlpatterns = [
    path("", include(router.urls)),
]
