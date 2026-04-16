from django.contrib import admin
from .models import Dataset, Category, Department


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display  = ['name', 'slug']
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ['name', 'code']


@admin.register(Dataset)
class DatasetAdmin(admin.ModelAdmin):
    list_display   = ['title', 'format', 'category', 'department',
                      'status', 'downloads', 'created_at']
    list_filter    = ['status', 'format', 'category', 'department']
    search_fields  = ['title', 'description']
    list_editable  = ['status']   # changer le statut directement depuis la liste
    readonly_fields= ['downloads', 'created_at', 'updated_at']
    fieldsets = (
        ('Informations principales', {
            'fields': ('title', 'description', 'category', 'department')
        }),
        ('Informations techniques', {
            'fields': ('format', 'projection', 'licence',
                       'file_url', 'file_size_mb', 'thumbnail')
        }),
        ('Gestion', {
            'fields': ('contributor', 'status', 'downloads',
                       'created_at', 'updated_at')
        }),
    )