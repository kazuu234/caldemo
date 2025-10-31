from __future__ import annotations
from django.core.management.base import BaseCommand
from pathlib import Path
import json
import re
from datetime import date
from api.models import Trip

ROOT = Path(__file__).resolve().parents[4]
SEED_JSON = ROOT / 'backend' / 'seed' / 'trips.json'
APP_TSX = ROOT / 'src' / 'App.tsx'

class Command(BaseCommand):
  help = 'Seed Trip data from backend/seed/trips.json or from src/App.tsx initialTrips.'

  def add_arguments(self, parser):
    parser.add_argument('--clean', action='store_true', help='Delete existing Trip data before seeding')
    parser.add_argument('--source', choices=['json', 'app'], help='Force source: json or app')

  def handle(self, *args, **options):
    if options['clean']:
      self.stdout.write('Cleaning existing trips...')
      Trip.objects.all().delete()

    source = options.get('source')
    if source == 'json' or (source is None and SEED_JSON.exists()):
      self._load_from_json(SEED_JSON)
      return

    if source == 'app' or (source is None and APP_TSX.exists()):
      self._load_from_app_tsx(APP_TSX)
      return

    self.stdout.write(self.style.ERROR('No seed source found. Place backend/seed/trips.json or ensure src/App.tsx contains initialTrips.'))

  def _load_from_json(self, path: Path):
    data = json.loads(path.read_text(encoding='utf-8'))
    count = 0
    for item in data:
      Trip.objects.create(
        type=item.get('type', 'trip'),
        user_discord_id=item['user_discord_id'],
        user_name=item.get('user_name', ''),
        user_avatar=item.get('user_avatar', ''),
        country=item['country'],
        city=item['city'],
        start_date=self._to_date(item['start_date']),
        end_date=self._to_date(item['end_date']),
        description=item.get('description', ''),
        is_recruitment=bool(item.get('is_recruitment', False)),
        recruitment_details=item.get('recruitment_details', ''),
        min_participants=item.get('min_participants'),
        max_participants=item.get('max_participants'),
        participants=item.get('participants', []),
        is_hidden=bool(item.get('is_hidden', False)),
      )
      count += 1
    self.stdout.write(self.style.SUCCESS(f'Loaded trips from JSON: {count}'))

  def _to_date(self, v) -> date:
    if isinstance(v, str):
      # Expect YYYY-MM-DD
      y, m, d = map(int, v.split('-'))
      return date(y, m, d)
    if isinstance(v, (list, tuple)) and len(v) >= 3:
      return date(int(v[0]), int(v[1]), int(v[2]))
    raise ValueError('Unsupported date format')

  def _load_from_app_tsx(self, path: Path):
    text = path.read_text(encoding='utf-8')
    # Extract initialTrips array content
    block = re.search(r'const\s+initialTrips\s*:\s*Trip\[]\s*=\s*\[([\s\S]*?)\];', text)
    if not block:
      self.stdout.write(self.style.ERROR('initialTrips array not found in App.tsx'))
      return
    body = block.group(1)
    # Split by objects heuristically: match { ... } top-level entries
    entries = re.findall(r'\{([\s\S]*?)\}\s*,?', body)
    count = 0
    for e in entries:
      def get_field(pattern: str, default: str | None = None):
        m = re.search(pattern, e)
        return m.group(1) if m else default
      type_val = get_field(r"type:\s*'([^']+)'", 'trip')
      user_discord_id = get_field(r"userDiscordId:\s*'([^']+)'", '') or ''
      user_name = get_field(r"userName:\s*'([^']+)'", '') or ''
      user_avatar = get_field(r"userAvatar:\s*'([^']+)'", '') or ''
      country = get_field(r"country:\s*'([^']+)'", '') or ''
      city = get_field(r"city:\s*'([^']+)'", '') or ''
      # Dates like new Date(2025, 10, 5)
      def parse_ts_date(field: str) -> date | None:
        m = re.search(rf"{field}:\s*new Date\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)\)", e)
        if not m:
          return None
        y = int(m.group(1))
        mth = int(m.group(2)) + 1  # JS month 0-based
        d = int(m.group(3))
        return date(y, mth, d)
      sd = parse_ts_date('startDate')
      ed = parse_ts_date('endDate')
      description = get_field(r"description:\s*'([^']*)'", '') or ''
      is_recruitment = bool(get_field(r"isRecruitment:\s*(true|false)", 'false') == 'true')
      recruitment_details = get_field(r"recruitmentDetails:\s*'([\s\S]*?)'", '') or ''
      min_participants = get_field(r"minParticipants:\s*(\d+)")
      max_participants = get_field(r"maxParticipants:\s*(\d+)")
      # participants: ['id1', 'id2']
      p_block = get_field(r"participants:\s*\[([\s\S]*?)\]")
      participants = []
      if p_block:
        participants = re.findall(r"'([^']+)'", p_block)
      if not (user_discord_id and country and city and sd and ed):
        continue
      Trip.objects.create(
        type=type_val,
        user_discord_id=user_discord_id,
        user_name=user_name,
        user_avatar=user_avatar,
        country=country,
        city=city,
        start_date=sd,
        end_date=ed,
        description=description,
        is_recruitment=is_recruitment,
        recruitment_details=recruitment_details,
        min_participants=int(min_participants) if min_participants else None,
        max_participants=int(max_participants) if max_participants else None,
        participants=participants,
        is_hidden=False,
      )
      count += 1
    self.stdout.write(self.style.SUCCESS(f'Loaded trips from App.tsx initialTrips: {count}'))
