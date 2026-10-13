from django.core.exceptions import ValidationError
from django.db import models


class SchoolProfile(models.Model):
    # A fixed primary key plus a database constraint allows only one profile.
    id = models.PositiveSmallIntegerField(primary_key=True, default=1, editable=False)
    name = models.CharField(max_length=200)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=50, blank=True)
    postal_address = models.TextField(blank=True)

    class Meta:
        verbose_name = "school profile"
        verbose_name_plural = "school profile"
        constraints = [
            models.CheckConstraint(
                condition=models.Q(id=1), name="school_profile_single_row"
            ),
        ]

    def clean(self):
        super().clean()
        self.name = self.name.strip()
        if not self.name:
            raise ValidationError({"name": "Enter the school name."})

    def __str__(self):
        return self.name
