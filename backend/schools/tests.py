from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.test import TestCase
from django.urls import reverse

from .models import SchoolProfile


class SchoolProfileTests(TestCase):
    def test_name_is_required_and_contacts_are_optional(self):
        profile = SchoolProfile(name="Example School")
        profile.full_clean()
        profile.save()
        self.assertEqual(SchoolProfile.objects.get().name, "Example School")

    def test_blank_name_and_invalid_email_are_rejected(self):
        for values in ({"name": "   "}, {"name": "School", "email": "invalid"}):
            with self.subTest(values=values), self.assertRaises(ValidationError):
                SchoolProfile(**values).full_clean()

    def test_database_rejects_a_second_profile(self):
        SchoolProfile.objects.create(name="Original School")
        for profile_id in (1, 2):
            with self.subTest(profile_id=profile_id):
                with self.assertRaises(IntegrityError), transaction.atomic():
                    SchoolProfile.objects.create(id=profile_id, name="Second School")
        self.assertEqual(SchoolProfile.objects.get().name, "Original School")


class SchoolProfileAdminTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_superuser(
            username="admin", email="admin@example.com", password="test-only-password"
        )
        self.add_url = reverse("admin:schools_schoolprofile_add")

    def test_anonymous_visitor_must_log_in(self):
        response = self.client.get(self.add_url)
        self.assertRedirects(
            response, reverse("admin:login") + "?next=" + self.add_url
        )

    def test_admin_can_create_and_edit_but_cannot_add_another(self):
        self.client.force_login(self.user)
        response = self.client.post(self.add_url, {"name": "Example School", "_save": "Save"})
        self.assertEqual(response.status_code, 302)
        profile = SchoolProfile.objects.get()
        self.assertEqual(profile.name, "Example School")
        self.assertEqual(self.client.get(self.add_url).status_code, 403)

        change_url = reverse("admin:schools_schoolprofile_change", args=[profile.pk])
        response = self.client.post(change_url, {"name": "Updated School", "_save": "Save"})
        self.assertEqual(response.status_code, 302)
        profile.refresh_from_db()
        self.assertEqual(profile.name, "Updated School")

        delete_url = reverse("admin:schools_schoolprofile_delete", args=[profile.pk])
        self.assertEqual(self.client.post(delete_url, {"post": "yes"}).status_code, 403)
        self.assertEqual(SchoolProfile.objects.count(), 1)


class SchoolProfileApiTests(TestCase):
    def test_no_profile_returns_an_explicit_empty_state(self):
        response = self.client.get(reverse("schools:profile"))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"school": None})

    def test_public_response_contains_only_the_saved_name(self):
        SchoolProfile.objects.create(
            name="Example School", email="office@example.com", phone="0123456789"
        )
        response = self.client.get(reverse("schools:profile"))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"school": {"name": "Example School"}})

    def test_public_endpoint_does_not_allow_edits(self):
        profile = SchoolProfile.objects.create(name="Example School")
        for method in ("post", "put", "patch", "delete"):
            with self.subTest(method=method):
                response = getattr(self.client, method)(
                    reverse("schools:profile"),
                    data='{"name": "Changed"}',
                    content_type="application/json",
                )
                self.assertEqual(response.status_code, 405)
        profile.refresh_from_db()
        self.assertEqual(profile.name, "Example School")
