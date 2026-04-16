from django.db import models
from django.contrib.auth.models import User


class Category(models.Model):
    name = models.CharField(max_length=100, verbose_name="Catégorie")
    slug = models.SlugField(unique=True)
    icon = models.CharField(max_length=50, blank=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "Catégories"


class Department(models.Model):
    name = models.CharField(max_length=100, verbose_name="Département")
    code = models.CharField(max_length=10, unique=True)

    def __str__(self):
        return self.name


class Dataset(models.Model):

    FORMAT_CHOICES = [
        ('shp',     'Shapefile'),
        ('geojson', 'GeoJSON'),
        ('gpkg',    'GeoPackage'),
        ('tif',     'Raster / GeoTIFF'),
        ('pdf',     'Carte PDF'),
        ('zip',     'Archive ZIP'),
    ]

    STATUS_CHOICES = [
        ('pending',  'En attente'),
        ('approved', 'Approuvé'),
        ('rejected', 'Rejeté'),
    ]

    LICENCE_CHOICES = [
        ('open',    'Open Data'),
        ('cc-by',   'CC BY 4.0'),
        ('cc-by-sa','CC BY-SA 4.0'),
        ('mit',     'MIT'),
    ]

    # Infos principales
    title       = models.CharField(max_length=200, verbose_name="Titre")
    description = models.TextField(verbose_name="Description")
    category    = models.ForeignKey(
        Category, on_delete=models.SET_NULL,
        null=True, related_name='datasets'
    )
    department  = models.ForeignKey(
        Department, on_delete=models.SET_NULL,
        null=True, related_name='datasets'
    )

    # Infos techniques
    format      = models.CharField(max_length=10, choices=FORMAT_CHOICES)
    projection  = models.CharField(max_length=50, default='EPSG:4326')
    licence     = models.CharField(max_length=20, choices=LICENCE_CHOICES,
                                   default='open')
    file_url    = models.URLField(verbose_name="URL du fichier")
    file_size_mb= models.FloatField(default=0, verbose_name="Taille (MB)")
    thumbnail   = models.ImageField(
        upload_to='thumbnails/', blank=True, null=True
    )

    # Méta
    contributor = models.ForeignKey(
        User, on_delete=models.SET_NULL,
        null=True, related_name='datasets'
    )
    status      = models.CharField(max_length=10, choices=STATUS_CHOICES,
                                   default='pending')
    downloads   = models.PositiveIntegerField(default=0)
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = "Datasets"