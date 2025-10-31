from django.contrib import admin
from .models import Trip

@admin.register(Trip)
class TripAdmin(admin.ModelAdmin):
    list_display = ("user_name", "country", "city", "start_date", "end_date", "is_recruitment")
    list_filter = ("country", "city", "is_recruitment")
    search_fields = ("user_name", "country", "city", "description")
