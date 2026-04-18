from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import (
    IsAuthenticatedOrReadOnly, IsAdminUser, AllowAny, IsAuthenticated
)
from django_filters.rest_framework import DjangoFilterBackend
from .models import Dataset, Category, Department
from .serializers import (
    DatasetListSerializer, DatasetDetailSerializer,
    DatasetCreateSerializer, CategorySerializer, DepartmentSerializer
)


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset           = Category.objects.all()
    serializer_class   = CategorySerializer
    permission_classes = []


class DepartmentViewSet(viewsets.ReadOnlyModelViewSet):
    queryset           = Department.objects.all()
    serializer_class   = DepartmentSerializer
    permission_classes = []


class DatasetViewSet(viewsets.ModelViewSet):
    filter_backends  = [DjangoFilterBackend, filters.SearchFilter,
                        filters.OrderingFilter]
    filterset_fields = ['category', 'department', 'format', 'licence', 'status']
    search_fields    = ['title', 'description']
    ordering_fields  = ['created_at', 'downloads', 'file_size_mb']

    def get_permissions(self):
        """
        create  → utilisateurs connectés seulement
        approve / destroy / update / partial_update → admin seulement
        list / retrieve → lecture libre
        """
        if self.action == 'create':
            return [IsAuthenticated()]
        if self.action in ('approve', 'destroy', 'update', 'partial_update'):
            return [IsAdminUser()]
        return [AllowAny()]   # list, retrieve, download

    def get_queryset(self):
        # Admin voit tout (pending + approved), visiteur voit seulement approved
        if self.request.user and self.request.user.is_staff:
            return Dataset.objects.all()
        return Dataset.objects.filter(status='approved')

    def get_serializer_class(self):
        if self.action == 'list':
            return DatasetListSerializer
        if self.action == 'create':
            return DatasetCreateSerializer
        return DatasetDetailSerializer

    def perform_create(self, serializer):
        # Statut forcé à 'pending' à la création, contributeur = user connecté
        serializer.save(status='pending', contributor=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[AllowAny])
    def download(self, request, pk=None):
        """Incrémente le compteur de téléchargements et retourne l'URL"""
        dataset = self.get_object()
        dataset.downloads += 1
        dataset.save(update_fields=['downloads'])
        return Response({'file_url': dataset.file_url})

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def approve(self, request, pk=None):
        """Approuver un dataset soumis (admin seulement)"""
        dataset = self.get_object()
        dataset.status = 'approved'
        dataset.save(update_fields=['status'])
        return Response({'status': 'approved'})

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def reject(self, request, pk=None):
        """Rejeter un dataset soumis (admin seulement)"""
        dataset = self.get_object()
        dataset.status = 'rejected'
        dataset.save(update_fields=['status'])
        return Response({'status': 'rejected'})