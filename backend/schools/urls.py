from django.urls import path

from . import views

app_name = "schools"

urlpatterns = [
    path("profile/", views.school_profile, name="profile"),
]
