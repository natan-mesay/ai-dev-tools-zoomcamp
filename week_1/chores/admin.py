from django.contrib import admin
from .models import FamilyMember, Chore, ChoreSubmission, Badge


@admin.register(FamilyMember)
class FamilyMemberAdmin(admin.ModelAdmin):
    list_display = ('avatar', 'name', 'role', 'level', 'xp', 'allowance_balance', 'current_streak')
    list_filter = ('role',)
    search_fields = ('name',)


@admin.register(Chore)
class ChoreAdmin(admin.ModelAdmin):
    list_display = ('icon', 'title', 'chore_type', 'frequency', 'reward_money', 'reward_xp', 'assigned_to', 'is_active')
    list_filter = ('chore_type', 'frequency', 'is_active')
    search_fields = ('title', 'description')


@admin.register(ChoreSubmission)
class ChoreSubmissionAdmin(admin.ModelAdmin):
    list_display = ('chore', 'member', 'status', 'submitted_at', 'reviewed_at', 'reviewed_by')
    list_filter = ('status', 'submitted_at')
    search_fields = ('chore__title', 'member__name', 'parent_note')
    readonly_fields = ('submitted_at',)


@admin.register(Badge)
class BadgeAdmin(admin.ModelAdmin):
    list_display = ('icon', 'name', 'required_xp', 'required_streak')
    filter_horizontal = ('members',)


