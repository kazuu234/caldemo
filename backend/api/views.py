from datetime import datetime
from django.db.models import Count
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.filters import OrderingFilter, SearchFilter
from django.utils.dateparse import parse_date
from .models import Trip, Notification, Comment, DateProposal, DateVote, Region, Country, City
from .serializers import (
    TripSerializer,
    NotificationSerializer,
    CommentSerializer,
    DateProposalSerializer,
    DateVoteSerializer,
    RegionSerializer,
    CountrySerializer,
    CitySerializer,
)


class TripViewSet(viewsets.ModelViewSet):
    queryset = Trip.objects.all()
    serializer_class = TripSerializer
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = [
        "user_name",
        "country",
        "city",
        "description",
        "recruitment_details",
    ]
    ordering_fields = ["start_date", "end_date", "created_at"]
    ordering = ["-start_date"]

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params

        user_discord_id = params.get("user_discord_id")
        trip_type = params.get("type")  # 'trip' | 'meetup'
        recruitment = params.get("is_recruitment")  # 'true' | 'false'
        hidden = params.get("is_hidden")
        country = params.get("country")
        city = params.get("city")
        start_date_gte = params.get("start_date_gte")
        start_date_lte = params.get("start_date_lte")

        if user_discord_id:
            qs = qs.filter(user_discord_id=user_discord_id)
        if trip_type in {"trip", "meetup"}:
            qs = qs.filter(type=trip_type)
        if recruitment in {"true", "false"}:
            qs = qs.filter(is_recruitment=(recruitment == "true"))
        if hidden in {"true", "false"}:
            qs = qs.filter(is_hidden=(hidden == "true"))
        if country:
            qs = qs.filter(country=country)
        if city:
            qs = qs.filter(city=city)
        if start_date_gte:
            d = parse_date(start_date_gte)
            if d:
                qs = qs.filter(start_date__gte=d)
        if start_date_lte:
            d = parse_date(start_date_lte)
            if d:
                qs = qs.filter(start_date__lte=d)
        return qs

    @action(detail=True, methods=["post"])
    def join(self, request, pk=None):
        trip: Trip = self.get_object()
        discord_id = request.data.get("discord_id")
        if not discord_id:
            return Response({"detail": "discord_id は必須です"}, status=status.HTTP_400_BAD_REQUEST)
        participants = list(trip.participants or [])
        if discord_id in participants:
            return Response({"detail": "すでに参加済みです"}, status=status.HTTP_200_OK)
        if trip.max_participants and len(participants) >= trip.max_participants:
            return Response({"detail": "参加枠が満席です"}, status=status.HTTP_400_BAD_REQUEST)
        participants.append(discord_id)
        trip.participants = participants
        trip.save(update_fields=["participants", "updated_at"])
        return Response(self.get_serializer(trip).data)

    @action(detail=True, methods=["post"])
    def leave(self, request, pk=None):
        trip: Trip = self.get_object()
        discord_id = request.data.get("discord_id")
        if not discord_id:
            return Response({"detail": "discord_id は必須です"}, status=status.HTTP_400_BAD_REQUEST)
        participants = list(trip.participants or [])
        if discord_id in participants:
            participants.remove(discord_id)
            trip.participants = participants
            trip.save(update_fields=["participants", "updated_at"])
        return Response(self.get_serializer(trip).data)

    @action(detail=True, methods=["post"])
    def toggle_recruitment(self, request, pk=None):
        trip: Trip = self.get_object()
        make_recruitment = request.data.get("is_recruitment")
        if make_recruitment is None:
            trip.is_recruitment = not trip.is_recruitment
        else:
            trip.is_recruitment = bool(make_recruitment)
        trip.save(update_fields=["is_recruitment", "updated_at"])
        return Response(self.get_serializer(trip).data)

    @action(detail=True, methods=["post"])
    def end_recruitment(self, request, pk=None):
        trip: Trip = self.get_object()
        trip.is_recruitment = False
        trip.recruitment_details = ""
        trip.save(update_fields=["is_recruitment", "recruitment_details", "updated_at"])
        return Response(self.get_serializer(trip).data)

    @action(detail=True, methods=["post"])
    def toggle_hidden(self, request, pk=None):
        trip: Trip = self.get_object()
        make_hidden = request.data.get("is_hidden")
        if make_hidden is None:
            trip.is_hidden = not trip.is_hidden
        else:
            trip.is_hidden = bool(make_hidden)
        trip.save(update_fields=["is_hidden", "updated_at"])
        return Response(self.get_serializer(trip).data)


class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    filter_backends = [OrderingFilter]
    ordering = ["-created_at"]

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params
        user_discord_id = params.get("user_discord_id")
        unread_only = params.get("unread_only")
        if user_discord_id:
            qs = qs.filter(user_discord_id=user_discord_id)
        if unread_only in {"true", "1"}:
            qs = qs.filter(read_at__isnull=True)
        return qs

    @action(detail=False, methods=["get"], url_path="count")
    def count(self, request):
        user_discord_id = request.query_params.get("user_discord_id")
        if not user_discord_id:
            return Response({"detail": "user_discord_id は必須です"}, status=400)
        total = Notification.objects.filter(user_discord_id=user_discord_id).count()
        unread = Notification.objects.filter(user_discord_id=user_discord_id, read_at__isnull=True).count()
        return Response({"total": total, "unread": unread})

    @action(detail=True, methods=["post"], url_path="mark_read")
    def mark_read(self, request, pk=None):
        notif: Notification = self.get_object()
        if notif.read_at is None:
            notif.read_at = datetime.utcnow()
            notif.save(update_fields=["read_at"])
        return Response(self.get_serializer(notif).data)

    @action(detail=False, methods=["post"], url_path="mark_all_read")
    def mark_all_read(self, request):
        user_discord_id = request.data.get("user_discord_id")
        if not user_discord_id:
            return Response({"detail": "user_discord_id は必須です"}, status=400)
        Notification.objects.filter(user_discord_id=user_discord_id, read_at__isnull=True).update(read_at=datetime.utcnow())
        return Response({"status": "ok"})


class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    filter_backends = [OrderingFilter, SearchFilter]
    ordering = ["created_at"]
    search_fields = ["content", "user_name", "user_discord_id"]

    def get_queryset(self):
        qs = super().get_queryset()
        trip = self.request.query_params.get("trip")
        if trip:
            qs = qs.filter(trip_id=trip)
        return qs


class DateProposalViewSet(viewsets.ModelViewSet):
    queryset = DateProposal.objects.all().annotate(votes_count=Count("votes"))
    serializer_class = DateProposalSerializer
    filter_backends = [OrderingFilter]
    ordering = ["date"]

    def get_queryset(self):
        qs = super().get_queryset()
        trip = self.request.query_params.get("trip")
        if trip:
            qs = qs.filter(trip_id=trip)
        return qs

    @action(detail=True, methods=["get"], url_path="votes")
    def votes(self, request, pk=None):
        proposal = self.get_object()
        votes = proposal.votes.all()
        return Response(DateVoteSerializer(votes, many=True).data)

    @action(detail=True, methods=["post"], url_path="vote")
    def vote(self, request, pk=None):
        proposal = self.get_object()
        discord_id = request.data.get("user_discord_id")
        if not discord_id:
            return Response({"detail": "user_discord_id は必須です"}, status=400)
        vote, _created = DateVote.objects.get_or_create(proposal=proposal, user_discord_id=discord_id)
        return Response(DateVoteSerializer(vote).data, status=201)

    @action(detail=True, methods=["post"], url_path="unvote")
    def unvote(self, request, pk=None):
        proposal = self.get_object()
        discord_id = request.data.get("user_discord_id")
        if not discord_id:
            return Response({"detail": "user_discord_id は必須です"}, status=400)
        DateVote.objects.filter(proposal=proposal, user_discord_id=discord_id).delete()
        return Response({"status": "ok"})


class RegionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Region.objects.all()
    serializer_class = RegionSerializer
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ["name", "code"]
    ordering = ["name"]


class CountryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Country.objects.select_related("region").all()
    serializer_class = CountrySerializer
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ["name", "code", "region__name", "region__code"]
    ordering = ["name"]

    def get_queryset(self):
        qs = super().get_queryset()
        region = self.request.query_params.get("region")
        region_code = self.request.query_params.get("region_code")
        if region:
            qs = qs.filter(region_id=region)
        if region_code:
            qs = qs.filter(region__code=region_code)
        return qs


class CityViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = City.objects.select_related("country", "country__region").all()
    serializer_class = CitySerializer
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ["name", "country__name", "country__code", "country__region__name", "country__region__code"]
    ordering = ["name"]

    def get_queryset(self):
        qs = super().get_queryset()
        country = self.request.query_params.get("country")
        country_code = self.request.query_params.get("country_code")
        region = self.request.query_params.get("region")
        region_code = self.request.query_params.get("region_code")
        if country:
            qs = qs.filter(country_id=country)
        if country_code:
            qs = qs.filter(country__code=country_code)
        if region:
            qs = qs.filter(country__region_id=region)
        if region_code:
            qs = qs.filter(country__region__code=region_code)
        return qs
