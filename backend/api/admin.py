from django.contrib import admin
from .models import Trip, Notification, Comment, DateProposal, DateVote, Region, Country, City, UserProfile

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("display_name", "username", "discord_id", "is_active")
    search_fields = ("display_name", "username", "discord_id")
    list_filter = ("is_active",)

@admin.register(Trip)
class TripAdmin(admin.ModelAdmin):
    list_display = ("user_name", "country", "city", "start_date", "end_date", "is_recruitment")
    list_filter = ("country", "city", "is_recruitment")
    search_fields = ("user_name", "country", "city", "description")

@admin.register(Region)
class RegionAdmin(admin.ModelAdmin):
    list_display = ("name", "code")
    search_fields = ("name", "code")

@admin.register(Country)
class CountryAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "region")
    list_filter = ("region",)
    search_fields = ("name", "code", "region__name")

@admin.register(City)
class CityAdmin(admin.ModelAdmin):
    list_display = ("name", "country")
    list_filter = ("country", "country__region")
    search_fields = ("name", "country__name", "country__code")
