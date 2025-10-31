from django.db import migrations, models
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0003_geo_models"),
    ]

    operations = [
        migrations.CreateModel(
            name='UserProfile',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('discord_id', models.CharField(db_index=True, max_length=32, unique=True)),
                ('username', models.CharField(max_length=50)),
                ('display_name', models.CharField(max_length=100)),
                ('discriminator', models.CharField(blank=True, max_length=10)),
                ('avatar', models.URLField(blank=True, max_length=500)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={'ordering': ['display_name', 'username']},
        ),
    ]
