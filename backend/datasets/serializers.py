from rest_framework import serializers
from .models import Dataset, Category, Department


class CategorySerializer(serializers.ModelSerializer):
    dataset_count = serializers.IntegerField(
        source='datasets.count', read_only=True
    )

    class Meta:
        model  = Category
        fields = ['id', 'name', 'slug', 'icon', 'dataset_count']


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Department
        fields = ['id', 'name', 'code']


class DatasetListSerializer(serializers.ModelSerializer):
    """Version courte — utilisée dans le catalogue (liste)"""
    category_name    = serializers.CharField(source='category.name',       read_only=True)
    department_name  = serializers.CharField(source='department.name',     read_only=True)
    contributor_name = serializers.CharField(source='contributor.username', read_only=True)

    class Meta:
        model  = Dataset
        fields = [
            'id', 'title', 'format', 'file_size_mb',
            'category_name', 'department_name', 'contributor_name',
            'licence', 'projection', 'downloads', 'created_at', 'thumbnail',
        ]


class DatasetDetailSerializer(serializers.ModelSerializer):
    """Version complète — utilisée sur la page détail d'un dataset"""
    category         = CategorySerializer(read_only=True)
    department       = DepartmentSerializer(read_only=True)
    contributor_name = serializers.CharField(
        source='contributor.username', read_only=True
    )

    class Meta:
        model  = Dataset
        fields = '__all__'


class DatasetCreateSerializer(serializers.ModelSerializer):
    """Pour la soumission d'un nouveau dataset (anonyme ou connecté)"""

    class Meta:
        model  = Dataset
        fields = [
            'title', 'description', 'category', 'department',
            'format', 'projection', 'licence', 'file_url', 'file_size_mb',
        ]

    def create(self, validated_data):
        request = self.context.get('request')

        # Si connecté → on lie le contributeur, sinon on laisse NULL
        if request and request.user and request.user.is_authenticated:
            validated_data['contributor'] = request.user

        return super().create(validated_data)