import json
from django.shortcuts import render, get_object_or_404, redirect
from django.http import JsonResponse, HttpResponseBadRequest
from django.urls import reverse
from django.views.decorators.http import require_POST
from .models import FamilyMember, Chore, ChoreSubmission, Badge


def kiosk_home(request):
    """
    Main Kiosk screen showing all family members with 1-tap avatar switching.
    """
    kids = FamilyMember.objects.filter(role=FamilyMember.Role.CHILD).order_by('name')
    parents = FamilyMember.objects.filter(role=FamilyMember.Role.PARENT).order_by('name')
    pending_submissions_count = ChoreSubmission.objects.filter(
        status=ChoreSubmission.Status.PENDING
    ).count()

    context = {
        'kids': kids,
        'parents': parents,
        'pending_submissions_count': pending_submissions_count,
        'active_member': None,
    }
    return render(request, 'chores/kiosk_home.html', context)


@require_POST
def verify_pin(request, member_id):
    """
    Verifies the 4-digit PIN for a parent profile.
    Accepts JSON or form data and returns a JSON response.
    """
    parent = get_object_or_404(FamilyMember, id=member_id, role=FamilyMember.Role.PARENT)
    
    pin = ''
    if request.content_type == 'application/json':
        try:
            data = json.loads(request.body)
            pin = data.get('pin', '')
        except (ValueError, json.JSONDecodeError):
            return JsonResponse({'success': False, 'message': 'Invalid JSON request'}, status=400)
    else:
        pin = request.POST.get('pin', '')

    pin = str(pin).strip()

    if parent.pin and parent.pin == pin:
        request.session['authenticated_parent_id'] = parent.id
        return JsonResponse({
            'success': True,
            'redirect_url': reverse('chores:parent_dashboard', args=[parent.id])
        })
    
    return JsonResponse({
        'success': False,
        'message': 'Incorrect PIN. Please try again.'
    }, status=400)


def kid_dashboard(request, member_id):
    """
    Dashboard for a child showing quests, progress, and balance.
    """
    kid = get_object_or_404(FamilyMember, id=member_id, role=FamilyMember.Role.CHILD)
    
    context = {
        'member': kid,
        'active_member': kid,
    }
    return render(request, 'chores/kid_dashboard.html', context)


def parent_dashboard(request, member_id):
    """
    PIN-protected parent approval dashboard.
    """
    parent = get_object_or_404(FamilyMember, id=member_id, role=FamilyMember.Role.PARENT)
    pending_submissions = ChoreSubmission.objects.filter(
        status=ChoreSubmission.Status.PENDING
    ).select_related('chore', 'member').order_by('-submitted_at')

    context = {
        'member': parent,
        'active_member': parent,
        'pending_submissions': pending_submissions,
        'pending_count': pending_submissions.count(),
    }
    return render(request, 'chores/parent_dashboard.html', context)
