from django.urls import path
from . import views

app_name = 'chores'

urlpatterns = [
    path('', views.kiosk_home, name='kiosk_home'),
    path('member/<int:member_id>/verify-pin/', views.verify_pin, name='verify_pin'),
    path('kid/<int:member_id>/', views.kid_dashboard, name='kid_dashboard'),
    path('parent/<int:member_id>/', views.parent_dashboard, name='parent_dashboard'),
]
