from django.test import TestCase, Client
from django.urls import reverse
from django.contrib import admin
from django.core.management import call_command
from decimal import Decimal
import json
from .models import FamilyMember, Chore, ChoreSubmission, Badge


class ModelTests(TestCase):
    def setUp(self):
        self.parent = FamilyMember.objects.create(
            name="Test Mom",
            role=FamilyMember.Role.PARENT,
            avatar="👩",
            pin="1234",
        )
        self.child = FamilyMember.objects.create(
            name="Test Kid",
            role=FamilyMember.Role.CHILD,
            avatar="🚀",
            xp=50,
            level=1,
            allowance_balance=Decimal("5.00"),
            current_streak=3,
        )
        self.chore = Chore.objects.create(
            title="Clean Room",
            description="Tidy up bed and desk",
            chore_type=Chore.ChoreType.ROUTINE,
            reward_money=Decimal("1.50"),
            reward_xp=30,
        )
        self.badge = Badge.objects.create(
            name="Test Badge",
            description="Achieved something cool",
            icon="🏆",
            required_xp=50,
            required_streak=1,
        )

    def test_family_member_properties(self):
        self.assertTrue(self.parent.is_parent)
        self.assertFalse(self.child.is_parent)
        self.assertEqual(str(self.parent), "👩 Test Mom (Parent)")
        self.assertEqual(str(self.child), "🚀 Test Kid (Child)")

    def test_add_xp_and_level_up(self):
        self.child.add_xp(60)  # Total 110 XP -> Level 2
        self.assertEqual(self.child.xp, 110)
        self.assertEqual(self.child.level, 2)

    def test_chore_str(self):
        self.assertIn("Clean Room", str(self.chore))

    def test_badge_str(self):
        self.assertEqual(str(self.badge), "🏆 Test Badge")


class AdminConfigTests(TestCase):
    def test_models_registered_in_admin(self):
        self.assertIn(FamilyMember, admin.site._registry)
        self.assertIn(Chore, admin.site._registry)
        self.assertIn(ChoreSubmission, admin.site._registry)
        self.assertIn(Badge, admin.site._registry)


class SeedDataCommandTests(TestCase):
    def test_seed_data_command(self):
        call_command('seed_data', clean=True)
        self.assertGreaterEqual(FamilyMember.objects.count(), 3)
        self.assertGreaterEqual(Chore.objects.count(), 5)
        self.assertGreaterEqual(Badge.objects.count(), 2)
        self.assertGreaterEqual(ChoreSubmission.objects.count(), 1)


class KioskViewTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.parent = FamilyMember.objects.create(
            name="Mom",
            role=FamilyMember.Role.PARENT,
            avatar="👩‍👧‍👦",
            pin="1234",
        )
        self.child = FamilyMember.objects.create(
            name="Leo",
            role=FamilyMember.Role.CHILD,
            avatar="🚀",
            xp=150,
            level=2,
            allowance_balance=Decimal("10.00"),
            current_streak=4,
        )
        self.chore = Chore.objects.create(
            title="Make Bed",
            chore_type=Chore.ChoreType.ROUTINE,
            reward_money=Decimal("0.50"),
            reward_xp=20,
        )
        self.submission = ChoreSubmission.objects.create(
            chore=self.chore,
            member=self.child,
            status=ChoreSubmission.Status.PENDING,
        )

    def test_kiosk_home_view(self):
        response = self.client.get(reverse('chores:kiosk_home'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Leo")
        self.assertContains(response, "Mom")
        self.assertContains(response, "Who is using the Kiosk?")
        self.assertEqual(response.context['pending_submissions_count'], 1)

    def test_verify_pin_success_json(self):
        url = reverse('chores:verify_pin', args=[self.parent.id])
        response = self.client.post(
            url,
            data=json.dumps({'pin': '1234'}),
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data['success'])
        self.assertEqual(data['redirect_url'], reverse('chores:parent_dashboard', args=[self.parent.id]))
        self.assertEqual(self.client.session.get('authenticated_parent_id'), self.parent.id)

    def test_verify_pin_failure_json(self):
        url = reverse('chores:verify_pin', args=[self.parent.id])
        response = self.client.post(
            url,
            data=json.dumps({'pin': '9999'}),
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertFalse(data['success'])
        self.assertIn('Incorrect PIN', data['message'])

    def test_verify_pin_non_parent(self):
        url = reverse('chores:verify_pin', args=[self.child.id])
        response = self.client.post(
            url,
            data=json.dumps({'pin': '1234'}),
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 404)

    def test_kid_dashboard_view(self):
        url = reverse('chores:kid_dashboard', args=[self.child.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Leo")
        self.assertContains(response, "Level 2")
        self.assertContains(response, "$10.00")

    def test_parent_dashboard_view(self):
        url = reverse('chores:parent_dashboard', args=[self.parent.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Mom")
        self.assertContains(response, "Make Bed")
        self.assertEqual(response.context['pending_count'], 1)
