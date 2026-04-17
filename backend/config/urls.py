from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import HttpResponse
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from datasets.views import DatasetViewSet, CategoryViewSet, DepartmentViewSet

router = DefaultRouter()
router.register('datasets',    DatasetViewSet,    basename='dataset')
router.register('categories',  CategoryViewSet,   basename='category')
router.register('departments', DepartmentViewSet, basename='department')

urlpatterns = [
    path('', lambda request: HttpResponse('API Geonia Hub active. Accédez à /admin/ ou /api/.'), name='home'),
    path('admin/',            admin.site.urls),
    path('api/',              include(router.urls)),
    path('api/auth/',         include('users.urls')),
    path('api/auth/login/',   TokenObtainPairView.as_view(), name='token_obtain'),
    path('api/auth/refresh/', TokenRefreshView.as_view(),    name='token_refresh'),

] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)