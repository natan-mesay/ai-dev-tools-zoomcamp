from django.db import models
from django.utils import timezone


class FamilyMember(models.Model):
    class Role(models.TextChoices):
        PARENT = 'PARENT', 'Parent'
        CHILD = 'CHILD', 'Child'

    name = models.CharField(max_length=100)
    role = models.CharField(max_length=10, choices=Role.choices, default=Role.CHILD)
    avatar = models.CharField(max_length=50, default='🦁', help_text="Avatar emoji or icon name")
    pin = models.CharField(max_length=4, blank=True, null=True, help_text="4-digit PIN for parent approval access")
    xp = models.PositiveIntegerField(default=0)
    level = models.PositiveIntegerField(default=1)
    allowance_balance = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    current_streak = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.avatar} {self.name} ({self.get_role_display()})"

    @property
    def is_parent(self):
        return self.role == self.Role.PARENT

    def add_xp(self, amount):
        self.xp += amount
        # Level formula: Every 100 XP is 1 level
        self.level = (self.xp // 100) + 1


class Chore(models.Model):
    class ChoreType(models.TextChoices):
        ROUTINE = 'ROUTINE', 'Daily Routine'
        BOUNTY = 'BOUNTY', 'Bounty Board'

    class Frequency(models.TextChoices):
        DAILY = 'DAILY', 'Daily'
        WEEKLY = 'WEEKLY', 'Weekly'
        ONE_OFF = 'ONE_OFF', 'One-off'

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, default='🧹')
    chore_type = models.CharField(max_length=10, choices=ChoreType.choices, default=ChoreType.ROUTINE)
    frequency = models.CharField(max_length=10, choices=Frequency.choices, default=Frequency.DAILY)
    reward_money = models.DecimalField(max_digits=6, decimal_places=2, default=1.00, help_text="Allowance earned in $")
    reward_xp = models.PositiveIntegerField(default=50, help_text="XP earned for completion")
    assigned_to = models.ForeignKey(
        FamilyMember,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_chores',
        help_text="Leave blank for open bounty chores"
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['chore_type', 'title']

    def __str__(self):
        return f"{self.icon} {self.title} (${self.reward_money} / {self.reward_xp} XP)"


class ChoreSubmission(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending Review'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Needs Rework'

    chore = models.ForeignKey(Chore, on_delete=models.CASCADE, related_name='submissions')
    member = models.ForeignKey(FamilyMember, on_delete=models.CASCADE, related_name='submissions')
    photo_proof = models.ImageField(upload_to='proofs/%Y/%m/%d/', blank=True, null=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    parent_note = models.TextField(blank=True, null=True, help_text="Feedback note from parent")
    submitted_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(blank=True, null=True)
    reviewed_by = models.ForeignKey(
        FamilyMember,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_submissions'
    )

    class Meta:
        ordering = ['-submitted_at']

    def __str__(self):
        return f"{self.member.name} - {self.chore.title} ({self.get_status_display()})"


class Badge(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()
    icon = models.CharField(max_length=50, default='🏆')
    required_xp = models.PositiveIntegerField(default=0)
    required_streak = models.PositiveIntegerField(default=0)
    members = models.ManyToManyField(FamilyMember, blank=True, related_name='badges')

    def __str__(self):
        return f"{self.icon} {self.name}"

