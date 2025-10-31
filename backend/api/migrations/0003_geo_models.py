from django.db import migrations, models
import uuid
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0002_notifications_comments_votes"),
    ]

    operations = [
        migrations.CreateModel(
            name='Region',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=100, unique=True)),
                ('code', models.CharField(max_length=32, unique=True)),
            ],
            options={'ordering': ['name']},
        ),
        migrations.CreateModel(
            name='Country',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=100)),
                ('code', models.CharField(blank=True, max_length=32)),
                ('region', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='countries', to='api.region')),
            ],
            options={'ordering': ['name'], 'unique_together': {('region', 'name')}},
        ),
        migrations.CreateModel(
            name='City',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=100)),
                ('country', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='cities', to='api.country')),
            ],
            options={'ordering': ['name'], 'unique_together': {('country', 'name')}},
        ),
    ]
