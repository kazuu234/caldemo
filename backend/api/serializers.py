from rest_framework import serializers
from .models import Trip, Notification, Comment, DateProposal, DateVote


class TripSerializer(serializers.ModelSerializer):
    class Meta:
        model = Trip
        fields = "__all__"

    def validate(self, attrs):
        start = attrs.get("start_date") or getattr(self.instance, "start_date", None)
        end = attrs.get("end_date") or getattr(self.instance, "end_date", None)
        if start and end and end < start:
            raise serializers.ValidationError({"end_date": "end_date は start_date 以降である必要があります。"})
        return attrs


class NotificationSerializer(serializers.ModelSerializer):
    unread = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            "id",
            "user_discord_id",
            "trip",
            "type",
            "title",
            "message",
            "created_at",
            "read_at",
            "unread",
        ]

    def get_unread(self, obj):
        return obj.read_at is None


class CommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = "__all__"


class DateVoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = DateVote
        fields = "__all__"


class DateProposalSerializer(serializers.ModelSerializer):
    votes_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = DateProposal
        fields = [
            "id",
            "trip",
            "date",
            "created_by_discord_id",
            "created_at",
            "votes_count",
        ]
