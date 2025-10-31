from django.db import migrations, models
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='Trip',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('type', models.CharField(choices=[('trip', 'Trip'), ('meetup', 'Meetup')], default='trip', max_length=16)),
                ('user_discord_id', models.CharField(db_index=True, max_length=32)),
                ('user_name', models.CharField(max_length=100)),
                ('user_avatar', models.URLField(blank=True, max_length=500)),
                ('country', models.CharField(max_length=100)),
                ('city', models.CharField(max_length=100)),
                ('start_date', models.DateField()),
                ('end_date', models.DateField()),
                ('description', models.TextField(blank=True)),
                ('is_recruitment', models.BooleanField(default=False)),
                ('recruitment_details', models.TextField(blank=True)),
                ('min_participants', models.PositiveIntegerField(blank=True, null=True)),
                ('max_participants', models.PositiveIntegerField(blank=True, null=True)),
                ('participants', models.JSONField(blank=True, default=list)),
                ('is_hidden', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'ordering': ['-start_date', '-created_at'],
            },
        ),
    ]
