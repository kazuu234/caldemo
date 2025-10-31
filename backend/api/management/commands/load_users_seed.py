from __future__ import annotations
from django.core.management.base import BaseCommand
from pathlib import Path
import re
from api.models import UserProfile

ROOT = Path(__file__).resolve().parents[4]
AUTH_TS = ROOT / 'src' / 'utils' / 'auth.ts'

class Command(BaseCommand):
    help = 'Seed UserProfile from frontend utils/auth.ts USERS_MASTER.'

    def add_arguments(self, parser):
        parser.add_argument('--clean', action='store_true', help='Delete existing user profiles before seeding')

    def handle(self, *args, **options):
        if options['clean']:
            self.stdout.write('Cleaning existing users...')
            UserProfile.objects.all().delete()

        if not AUTH_TS.exists():
            self.stdout.write(self.style.ERROR(f'auth.ts not found at {AUTH_TS}'))
            return

        text = AUTH_TS.read_text(encoding='utf-8')
        block = re.search(r'USERS_MASTER\s*=\s*\[([\s\S]*?)\]\s*;', text)
        if not block:
            self.stdout.write(self.style.ERROR('USERS_MASTER array not found'))
            return
        body = block.group(1)
        # Extract objects
        # Each object has: discordId, username, displayName, discriminator, avatar
        entries = re.findall(
            r"\{\s*discordId:\s*'([^']+)',\s*username:\s*'([^']+)',\s*displayName:\s*'([^']+)',\s*discriminator:\s*'([^']+)',\s*avatar:\s*'([^']+)'\s*\}",
            body
        )
        count = 0
        for discord_id, username, display_name, discriminator, avatar in entries:
            obj, created = UserProfile.objects.update_or_create(
                discord_id=discord_id,
                defaults={
                    'username': username,
                    'display_name': display_name,
                    'discriminator': discriminator,
                    'avatar': avatar,
                    'is_active': True,
                }
            )
            count += 1
        self.stdout.write(self.style.SUCCESS(f'Loaded users: {count}'))
