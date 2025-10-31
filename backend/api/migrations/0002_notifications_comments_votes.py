from django.db import migrations, models
import uuid
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name='Notification',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('user_discord_id', models.CharField(db_index=True, max_length=32)),
                ('type', models.CharField(choices=[('recruitment', 'Recruitment'), ('day_before', 'Day Before'), ('same_day', 'Same Day'), ('comment', 'Comment'), ('other', 'Other')], default='other', max_length=32)),
                ('title', models.CharField(blank=True, max_length=200)),
                ('message', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('read_at', models.DateTimeField(blank=True, null=True)),
                ('trip', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='notifications', to='api.trip')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='notification',
            index=models.Index(fields=['user_discord_id', 'created_at'], name='api_notific_user_di_2bbeb1_idx'),
        ),
        migrations.CreateModel(
            name='Comment',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('user_discord_id', models.CharField(db_index=True, max_length=32)),
                ('user_name', models.CharField(max_length=100)),
                ('content', models.TextField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('trip', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='comments', to='api.trip')),
            ],
            options={
                'ordering': ['created_at'],
            },
        ),
        migrations.CreateModel(
            name='DateProposal',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('date', models.DateField()),
                ('created_by_discord_id', models.CharField(max_length=32)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('trip', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='date_proposals', to='api.trip')),
            ],
            options={
                'ordering': ['date'],
            },
        ),
        migrations.AlterUniqueTogether(
            name='dateproposal',
            unique_together={('trip', 'date')},
        ),
        migrations.CreateModel(
            name='DateVote',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('user_discord_id', models.CharField(max_length=32)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('proposal', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='votes', to='api.dateproposal')),
            ],
        ),
        migrations.AlterUniqueTogether(
            name='datevote',
            unique_together={('proposal', 'user_discord_id')},
        ),
    ]
