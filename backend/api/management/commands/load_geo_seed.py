from __future__ import annotations
from django.core.management.base import BaseCommand, CommandError
from pathlib import Path
import json
import re
from api.models import Region, Country, City

ROOT = Path(__file__).resolve().parents[4]  # repository root

COUNTRIES_TS = ROOT / 'src' / 'components' / 'countries-data.ts'
JAPAN_CITIES_TS = ROOT / 'src' / 'components' / 'japan-cities-data.ts'

REGION_CODES = {
    'アジア': 'ASIA',
    'ヨーロッパ': 'EUROPE',
    '北米': 'NA',
    '南米': 'SA',
    'アフリカ': 'AFRICA',
    'オセアニア': 'OCEANIA',
    '中東': 'MIDDLE_EAST',
    '日本': 'JAPAN',
}

class Command(BaseCommand):
    help = 'Seed Regions/Countries/Cities from frontend TS demo data.'

    def add_arguments(self, parser):
        parser.add_argument('--clean', action='store_true', help='Delete existing geo data before seeding')

    def handle(self, *args, **options):
        if options['clean']:
            self.stdout.write('Cleaning existing geo data...')
            City.objects.all().delete()
            Country.objects.all().delete()
            Region.objects.all().delete()

        regions = self._ensure_regions()
        countries = self._load_countries(regions)
        self._load_japan_cities(countries)
        self.stdout.write(self.style.SUCCESS('Geo seed completed.'))

    def _ensure_regions(self) -> dict[str, Region]:
        region_map: dict[str, Region] = {}
        for name, code in REGION_CODES.items():
            region, _ = Region.objects.get_or_create(code=code, defaults={'name': name})
            if region.name != name:
                region.name = name
                region.save(update_fields=['name'])
            region_map[name] = region
        return region_map

    def _load_countries(self, regions: dict[str, Region]) -> dict[str, Country]:
        if not COUNTRIES_TS.exists():
            self.stdout.write(self.style.WARNING(f'countries-data.ts not found at {COUNTRIES_TS}'))
            return {}

        text = COUNTRIES_TS.read_text(encoding='utf-8')
        # 想定: REGIONS or COUNTRIES_BY_REGION のような構造から国名を抽出
        # まず、"COUNTRIES_BY_REGION = { ... }" のオブジェクトを取り出す
        obj_match = re.search(r'COUNTRIES_BY_REGION\s*=\s*\{([\s\S]*?)\}\s*;', text)
        countries_by_region: dict[str, list[str]] = {}
        if obj_match:
            obj_body = obj_match.group(1)
            # 例: 'アジア': [ { name: '日本' }, { name: 'タイ' } ],
            region_blocks = re.findall(r"'([^']+)'\s*:\s*\[([\s\S]*?)\]", obj_body)
            for region_name, arr_body in region_blocks:
                names = re.findall(r"name\s*:\s*'([^']+)'", arr_body)
                if names:
                    countries_by_region[region_name] = names
        else:
            # フォールバック: 単純な配列 COUNTRIES = [ '日本', 'タイ', ... ] のようなものがあれば拾う
            arr_match = re.search(r'COUNTRIES\s*=\s*\[([\s\S]*?)\]\s*;', text)
            if arr_match:
                names = re.findall(r"'([^']+)'", arr_match.group(1))
                if names:
                    countries_by_region['その他'] = names

        created_countries: dict[str, Country] = {}
        for region_name, names in countries_by_region.items():
            region = regions.get(region_name)
            if not region:
                # 未定義リージョンはコード生成
                code = re.sub(r'[^A-Z]', '', region_name.upper()) or f'R{len(regions)+1}'
                region, _ = Region.objects.get_or_create(code=code, defaults={'name': region_name})
            for country_name in names:
                country, _ = Country.objects.get_or_create(region=region, name=country_name, defaults={'code': ''})
                created_countries[country.name] = country
        self.stdout.write(self.style.SUCCESS(f'Loaded countries: {sum(len(v) for v in countries_by_region.values())}'))
        return created_countries

    def _load_japan_cities(self, countries: dict[str, Country]):
        if not JAPAN_CITIES_TS.exists():
            self.stdout.write(self.style.WARNING(f'japan-cities-data.ts not found at {JAPAN_CITIES_TS}'))
            return
        text = JAPAN_CITIES_TS.read_text(encoding='utf-8')
        # 想定: JAPAN_CITIES = [ { prefecture: '東京都', cities: ['渋谷区', ...] }, ... ] など
        # 緩い正規表現で配列を抽出
        block = re.search(r'JAPAN_CITIES\s*=\s*\[([\s\S]*?)\]\s*;', text)
        japan_country = countries.get('日本')
        if not japan_country:
            # 日本が未作成なら Region 日本/JAPAN を作成して国を挿入
            region, _ = Region.objects.get_or_create(code='JAPAN', defaults={'name': '日本'})
            japan_country, _ = Country.objects.get_or_create(region=region, name='日本', defaults={'code': 'JP'})
        if block:
            body = block.group(1)
            # prefecture 名を抽出
            prefectures = re.findall(r"prefecture\s*:\s*'([^']+)'\s*,\s*cities\s*:\s*\[([\s\S]*?)\]", body)
            count = 0
            for pref_name, cities_body in prefectures:
                # 県名も都市として扱うかは要件次第。ここでは cities のみ登録
                city_names = re.findall(r"'([^']+)'", cities_body)
                for name in city_names:
                    City.objects.get_or_create(country=japan_country, name=name)
                    count += 1
            self.stdout.write(self.style.SUCCESS(f'Loaded Japan cities: {count}'))
        else:
            # フォールバック: JAPAN_CITIES_BY_REGION 等の他構造にも対応可（必要に応じて拡張）
            self.stdout.write(self.style.WARNING('JAPAN_CITIES array not found; skipped city import.'))
