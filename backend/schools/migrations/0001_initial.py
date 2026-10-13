from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="SchoolProfile",
            fields=[
                ("id", models.PositiveSmallIntegerField(default=1, editable=False, primary_key=True, serialize=False)),
                ("name", models.CharField(max_length=200)),
                ("email", models.EmailField(blank=True, max_length=254)),
                ("phone", models.CharField(blank=True, max_length=50)),
                ("postal_address", models.TextField(blank=True)),
            ],
            options={
                "verbose_name": "school profile",
                "verbose_name_plural": "school profile",
                "constraints": [
                    models.CheckConstraint(condition=models.Q(id=1), name="school_profile_single_row"),
                ],
            },
        ),
    ]
