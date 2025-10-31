from django.db import models
import uuid


class UserProfile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    discord_id = models.CharField(max_length=32, unique=True, db_index=True)
    username = models.CharField(max_length=50)
    display_name = models.CharField(max_length=100)
    discriminator = models.CharField(max_length=10, blank=True)
    avatar = models.URLField(max_length=500, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["display_name", "username"]

    def __str__(self) -> str:
        return f"{self.display_name} (@{self.username})"


class Trip(models.Model):
    class TripType(models.TextChoices):
        TRIP = "trip", "Trip"
        MEETUP = "meetup", "Meetup"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    type = models.CharField(max_length=16, choices=TripType.choices, default=TripType.TRIP)

    user_discord_id = models.CharField(max_length=32, db_index=True)
    user_name = models.CharField(max_length=100)
    user_avatar = models.URLField(max_length=500, blank=True)

    country = models.CharField(max_length=100)
    city = models.CharField(max_length=100)

    start_date = models.DateField()
    end_date = models.DateField()

    description = models.TextField(blank=True)

    is_recruitment = models.BooleanField(default=False)
    recruitment_details = models.TextField(blank=True)

    min_participants = models.PositiveIntegerField(null=True, blank=True)
    max_participants = models.PositiveIntegerField(null=True, blank=True)

    participants = models.JSONField(default=list, blank=True)
    is_hidden = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-start_date", "-created_at"]

    def __str__(self) -> str:
        return f"{self.user_name} - {self.country}/{self.city} ({self.start_date} - {self.end_date})"


class Notification(models.Model):
    class NotificationType(models.TextChoices):
        RECRUITMENT = "recruitment", "Recruitment"
        DAY_BEFORE = "day_before", "Day Before"
        SAME_DAY = "same_day", "Same Day"
        COMMENT = "comment", "Comment"
        OTHER = "other", "Other"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_discord_id = models.CharField(max_length=32, db_index=True)
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, null=True, blank=True, related_name="notifications")
    type = models.CharField(max_length=32, choices=NotificationType.choices, default=NotificationType.OTHER)
    title = models.CharField(max_length=200, blank=True)
    message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["user_discord_id", "created_at"]),
        ]
        ordering = ["-created_at"]


class Comment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name="comments")
    user_discord_id = models.CharField(max_length=32, db_index=True)
    user_name = models.CharField(max_length=100)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["created_at"]


class DateProposal(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name="date_proposals")
    date = models.DateField()
    created_by_discord_id = models.CharField(max_length=32)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("trip", "date")
        ordering = ["date"]


class DateVote(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    proposal = models.ForeignKey(DateProposal, on_delete=models.CASCADE, related_name="votes")
    user_discord_id = models.CharField(max_length=32)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("proposal", "user_discord_id")


class Region(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=32, unique=True)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class Country(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=32, blank=True)
    region = models.ForeignKey(Region, on_delete=models.PROTECT, related_name="countries")

    class Meta:
        unique_together = ("region", "name")
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class City(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    country = models.ForeignKey(Country, on_delete=models.PROTECT, related_name="cities")

    class Meta:
        unique_together = ("country", "name")
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name
