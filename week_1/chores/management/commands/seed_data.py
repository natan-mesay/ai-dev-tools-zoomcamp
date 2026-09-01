from django.core.management.base import BaseCommand
from django.utils import timezone
from decimal import Decimal
from chores.models import FamilyMember, Chore, ChoreSubmission, Badge


class Command(BaseCommand):
    help = 'Seeds the database with initial family members, routine chores, bounties, badges, and sample submissions.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clean',
            action='store_true',
            help='Delete existing chore data before seeding',
        )

    def handle(self, *args, **options):
        if options['clean']:
            self.stdout.write(self.style.WARNING('Cleaning existing chore records...'))
            ChoreSubmission.objects.all().delete()
            Chore.objects.all().delete()
            Badge.objects.all().delete()
            FamilyMember.objects.all().delete()

        self.stdout.write(self.style.NOTICE('Seeding family members...'))
        
        # 1. Family Members
        mom, _ = FamilyMember.objects.get_or_create(
            name="Sarah (Mom)",
            defaults={
                'role': FamilyMember.Role.PARENT,
                'avatar': '👩‍👧‍👦',
                'pin': '1234',
                'allowance_balance': Decimal('0.00'),
                'xp': 0,
                'level': 1,
                'current_streak': 0,
            }
        )

        dad, _ = FamilyMember.objects.get_or_create(
            name="David (Dad)",
            defaults={
                'role': FamilyMember.Role.PARENT,
                'avatar': '👨‍👧‍👦',
                'pin': '5678',
                'allowance_balance': Decimal('0.00'),
                'xp': 0,
                'level': 1,
                'current_streak': 0,
            }
        )

        leo, _ = FamilyMember.objects.get_or_create(
            name="Leo",
            defaults={
                'role': FamilyMember.Role.CHILD,
                'avatar': '🚀',
                'pin': None,
                'allowance_balance': Decimal('12.50'),
                'xp': 140,
                'level': 2,
                'current_streak': 4,
            }
        )

        maya, _ = FamilyMember.objects.get_or_create(
            name="Maya",
            defaults={
                'role': FamilyMember.Role.CHILD,
                'avatar': '🦄',
                'pin': None,
                'allowance_balance': Decimal('5.00'),
                'xp': 45,
                'level': 1,
                'current_streak': 2,
            }
        )

        sammy, _ = FamilyMember.objects.get_or_create(
            name="Sammy",
            defaults={
                'role': FamilyMember.Role.CHILD,
                'avatar': '🦖',
                'pin': None,
                'allowance_balance': Decimal('18.00'),
                'xp': 210,
                'level': 3,
                'current_streak': 7,
            }
        )

        self.stdout.write(self.style.NOTICE('Seeding badges...'))
        
        # 2. Badges
        badge_rookie, _ = Badge.objects.get_or_create(
            name="Chore Rookie",
            defaults={
                'icon': '🌱',
                'description': 'Earn your first 50 XP to kickstart your household habit.',
                'required_xp': 50,
                'required_streak': 0,
            }
        )

        badge_streak, _ = Badge.objects.get_or_create(
            name="Streak Master",
            defaults={
                'icon': '🔥',
                'description': 'Complete chores 3 days in a row without missing a day.',
                'required_xp': 0,
                'required_streak': 3,
            }
        )

        badge_helper, _ = Badge.objects.get_or_create(
            name="Super Helper",
            defaults={
                'icon': '⭐',
                'description': 'Reach Level 2 by earning 100 total XP.',
                'required_xp': 100,
                'required_streak': 0,
            }
        )

        badge_legend, _ = Badge.objects.get_or_create(
            name="Household Legend",
            defaults={
                'icon': '👑',
                'description': 'Reach Level 3 and maintain a 7-day chore streak.',
                'required_xp': 200,
                'required_streak': 7,
            }
        )

        # Assign badges to kids
        leo.badges.add(badge_rookie, badge_streak, badge_helper)
        sammy.badges.add(badge_rookie, badge_streak, badge_helper, badge_legend)

        self.stdout.write(self.style.NOTICE('Seeding chores...'))

        # 3. Routine Chores
        routines_data = [
            {
                'title': 'Make Bed',
                'description': 'Straighten sheets, fluff pillows, and fold blanket neatly.',
                'icon': '🛏️',
                'chore_type': Chore.ChoreType.ROUTINE,
                'frequency': Chore.Frequency.DAILY,
                'reward_money': Decimal('0.50'),
                'reward_xp': 20,
            },
            {
                'title': 'Brush Teeth (Morning & Night)',
                'description': 'Brush for 2 full minutes twice a day.',
                'icon': '🪥',
                'chore_type': Chore.ChoreType.ROUTINE,
                'frequency': Chore.Frequency.DAILY,
                'reward_money': Decimal('0.50'),
                'reward_xp': 20,
            },
            {
                'title': 'Put Away Toys & Books',
                'description': 'Clear the floor and put toys and books back into storage bins.',
                'icon': '🧸',
                'chore_type': Chore.ChoreType.ROUTINE,
                'frequency': Chore.Frequency.DAILY,
                'reward_money': Decimal('1.00'),
                'reward_xp': 30,
            },
            {
                'title': 'Feed the Family Pet',
                'description': 'Provide pet food and refresh the water bowl.',
                'icon': '🐶',
                'chore_type': Chore.ChoreType.ROUTINE,
                'frequency': Chore.Frequency.DAILY,
                'reward_money': Decimal('1.00'),
                'reward_xp': 25,
            },
            {
                'title': 'School Bag & Homework Ready',
                'description': 'Check homework is complete and pack bag for tomorrow.',
                'icon': '🎒',
                'chore_type': Chore.ChoreType.ROUTINE,
                'frequency': Chore.Frequency.DAILY,
                'reward_money': Decimal('1.00'),
                'reward_xp': 25,
            },
        ]

        created_routines = []
        for r_data in routines_data:
            c, _ = Chore.objects.get_or_create(title=r_data['title'], defaults=r_data)
            created_routines.append(c)

        # 4. Bounty Board Chores
        bounties_data = [
            {
                'title': 'Wash the Family Car',
                'description': 'Use bucket, sponge, and hose to wash outside of car and wheels.',
                'icon': '🚗',
                'chore_type': Chore.ChoreType.BOUNTY,
                'frequency': Chore.Frequency.WEEKLY,
                'reward_money': Decimal('5.00'),
                'reward_xp': 100,
            },
            {
                'title': 'Rake Garden Leaves',
                'description': 'Rake lawn and gather leaves into garden compost bags.',
                'icon': '🍂',
                'chore_type': Chore.ChoreType.BOUNTY,
                'frequency': Chore.Frequency.ONE_OFF,
                'reward_money': Decimal('4.00'),
                'reward_xp': 80,
            },
            {
                'title': 'Vacuum Living Room',
                'description': 'Thoroughly vacuum rugs, carpets, and around the sofa.',
                'icon': '🧹',
                'chore_type': Chore.ChoreType.BOUNTY,
                'frequency': Chore.Frequency.WEEKLY,
                'reward_money': Decimal('3.00'),
                'reward_xp': 60,
            },
            {
                'title': 'Fold & Put Away Laundry',
                'description': 'Fold clean clothes from the dryer and sort into drawers.',
                'icon': '🧺',
                'chore_type': Chore.ChoreType.BOUNTY,
                'frequency': Chore.Frequency.WEEKLY,
                'reward_money': Decimal('3.50'),
                'reward_xp': 70,
            },
            {
                'title': 'Organize Kitchen Pantry',
                'description': 'Sort canned goods, snacks, and boxes neatly with labels facing out.',
                'icon': '🥫',
                'chore_type': Chore.ChoreType.BOUNTY,
                'frequency': Chore.Frequency.ONE_OFF,
                'reward_money': Decimal('2.50'),
                'reward_xp': 50,
            },
        ]

        created_bounties = []
        for b_data in bounties_data:
            c, _ = Chore.objects.get_or_create(title=b_data['title'], defaults=b_data)
            created_bounties.append(c)

        # 5. Sample Submissions for Testing Parent Approval Queue
        self.stdout.write(self.style.NOTICE('Seeding sample submissions...'))
        
        # Pending submission 1: Leo - Vacuum Living Room
        ChoreSubmission.objects.get_or_create(
            chore=created_bounties[2],  # Vacuum Living Room
            member=leo,
            status=ChoreSubmission.Status.PENDING,
            defaults={
                'parent_note': '',
            }
        )

        # Pending submission 2: Maya - Make Bed
        ChoreSubmission.objects.get_or_create(
            chore=created_routines[0],  # Make Bed
            member=maya,
            status=ChoreSubmission.Status.PENDING,
            defaults={
                'parent_note': '',
            }
        )

        # Approved submission: Leo - Make Bed
        ChoreSubmission.objects.get_or_create(
            chore=created_routines[0],  # Make Bed
            member=leo,
            status=ChoreSubmission.Status.APPROVED,
            defaults={
                'reviewed_at': timezone.now(),
                'reviewed_by': mom,
                'parent_note': 'Great job straightening the corners!',
            }
        )

        self.stdout.write(self.style.SUCCESS('Successfully seeded database!'))
        self.stdout.write(self.style.SUCCESS(f'- {FamilyMember.objects.count()} Family Members'))
        self.stdout.write(self.style.SUCCESS(f'- {Chore.objects.count()} Chores ({Chore.objects.filter(chore_type="ROUTINE").count()} Routines, {Chore.objects.filter(chore_type="BOUNTY").count()} Bounties)'))
        self.stdout.write(self.style.SUCCESS(f'- {Badge.objects.count()} Badges'))
        self.stdout.write(self.style.SUCCESS(f'- {ChoreSubmission.objects.count()} Submissions ({ChoreSubmission.objects.filter(status="PENDING").count()} Pending)'))
