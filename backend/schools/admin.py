from django.contrib import admin

from .models import SchoolProfile


@admin.register(SchoolProfile)
class SchoolProfileAdmin(admin.ModelAdmin):
    fields = ("name", "email", "phone", "postal_address")
    list_display = ("name", "email", "phone")

    def has_add_permission(self, request):
        return super().has_add_permission(request) and not SchoolProfile.objects.exists()

    def has_delete_permission(self, request, obj=None):
        # Update the existing profile instead of deleting the school's identity.
        return False
