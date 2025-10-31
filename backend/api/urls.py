from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TripViewSet, NotificationViewSet, CommentViewSet, DateProposalViewSet, RegionViewSet, CountryViewSet, CityViewSet, UserProfileViewSet

router = DefaultRouter()
router.register(r"users", UserProfileViewSet, basename="userprofile")
router.register(r"trips", TripViewSet, basename="trip")
router.register(r"notifications", NotificationViewSet, basename="notification")
router.register(r"comments", CommentViewSet, basename="comment")
router.register(r"date_proposals", DateProposalViewSet, basename="dateproposal")
router.register(r"regions", RegionViewSet, basename="region")
router.register(r"countries", CountryViewSet, basename="country")
router.register(r"cities", CityViewSet, basename="city")

urlpatterns = [
    path("", include(router.urls)),
]
