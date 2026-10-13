from django.http import JsonResponse
from django.views.decorators.http import require_GET

from .models import SchoolProfile


@require_GET
def school_profile(request):
    profile = SchoolProfile.objects.only("name").first()
    # The public page needs only the school name. Editing stays in admin.
    return JsonResponse({"school": {"name": profile.name} if profile else None})
