from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from datasets.models import Category, Department, Dataset


class Command(BaseCommand):
    help = 'Remplir la base avec des données de test'

    def handle(self, *args, **kwargs):

        self.stdout.write('Création des catégories...')
        categories = {
            'routes':       Category.objects.get_or_create(
                                name='Réseau routier',       slug='routes')[0],
            'admin':        Category.objects.get_or_create(
                                name='Limites administratives', slug='admin')[0],
            'hydro':        Category.objects.get_or_create(
                                name='Hydrographie',         slug='hydro')[0],
            'infra':        Category.objects.get_or_create(
                                name='Infrastructures',      slug='infra')[0],
            'raster':       Category.objects.get_or_create(
                                name='Raster / MNT',         slug='raster')[0],
            'forets':       Category.objects.get_or_create(
                                name='Forêts',               slug='forets')[0],
            'cartes':       Category.objects.get_or_create(
                                name='Cartes PDF',           slug='cartes')[0],
        }

        self.stdout.write('Création des départements...')
        departments = {
            'bzv':    Department.objects.get_or_create(
                          name='Brazzaville',  code='BZV')[0],
            'pnr':    Department.objects.get_or_create(
                          name='Kouilou',      code='KOU')[0],
            'pool':   Department.objects.get_or_create(
                          name='Pool',         code='POO')[0],
            'sangha': Department.objects.get_or_create(
                          name='Sangha',       code='SAN')[0],
            'niari':  Department.objects.get_or_create(
                          name='Niari',        code='NIA')[0],
            'nat':    Department.objects.get_or_create(
                          name='National',     code='NAT')[0],
        }

        # Récupère le superuser créé à l'étape 11
        admin = User.objects.filter(is_superuser=True).first()

        self.stdout.write('Création des datasets...')
        datasets = [
            {
                'title':       'Limites départements Congo 2024',
                'description': 'Shapefile des 12 départements du Congo-Brazzaville. '
                               'Source : IGC. Projection WGS84.',
                'category':    categories['admin'],
                'department':  departments['nat'],
                'format':      'shp',
                'projection':  'EPSG:4326',
                'licence':     'open',
                'file_url':    'https://example.com/limites_depts_2024.shp',
                'file_size_mb': 2.4,
                'status':      'approved',
                'downloads':   145,
            },
            {
                'title':       'MNT SRTM 30m — Brazzaville',
                'description': 'Modèle numérique de terrain SRTM résolution 30m '
                               'couvrant la ville de Brazzaville.',
                'category':    categories['raster'],
                'department':  departments['bzv'],
                'format':      'tif',
                'projection':  'EPSG:4326',
                'licence':     'open',
                'file_url':    'https://example.com/srtm_bzv_30m.tif',
                'file_size_mb': 87.0,
                'status':      'approved',
                'downloads':   98,
            },
            {
                'title':       'Routes OSM — Pointe-Noire',
                'description': 'Réseau routier extrait d\'OpenStreetMap pour '
                               'la ville de Pointe-Noire. Inclut routes '
                               'principales et secondaires.',
                'category':    categories['routes'],
                'department':  departments['pnr'],
                'format':      'geojson',
                'projection':  'EPSG:4326',
                'licence':     'cc-by',
                'file_url':    'https://example.com/routes_pnr.geojson',
                'file_size_mb': 12.0,
                'status':      'approved',
                'downloads':   210,
            },
            {
                'title':       'Bâtiments OSM — Brazzaville',
                'description': 'Emprises des bâtiments extraits d\'OSM '
                               'pour Brazzaville. Inclut écoles, '
                               'hôpitaux, marchés.',
                'category':    categories['infra'],
                'department':  departments['bzv'],
                'format':      'shp',
                'projection':  'EPSG:4326',
                'licence':     'cc-by',
                'file_url':    'https://example.com/batiments_bzv.shp',
                'file_size_mb': 34.0,
                'status':      'approved',
                'downloads':   188,
            },
            {
                'title':       'Hydrographie — Bassin Kouilou-Niari',
                'description': 'Cours d\'eau principaux et secondaires '
                               'du bassin versant Kouilou-Niari. '
                               'Dérivé du SRTM 30m.',
                'category':    categories['hydro'],
                'department':  departments['pnr'],
                'format':      'geojson',
                'projection':  'EPSG:4326',
                'licence':     'open',
                'file_url':    'https://example.com/hydro_kouilou.geojson',
                'file_size_mb': 8.0,
                'status':      'approved',
                'downloads':   92,
            },
            {
                'title':       'Couverture forestière Congo 2023',
                'description': 'Raster classification forêt/non-forêt '
                               'à partir d\'images Sentinel-2. '
                               'Résolution 10m. Tout le territoire.',
                'category':    categories['forets'],
                'department':  departments['nat'],
                'format':      'tif',
                'projection':  'EPSG:4326',
                'licence':     'cc-by-sa',
                'file_url':    'https://example.com/forets_sentinel2_2023.tif',
                'file_size_mb': 210.0,
                'status':      'approved',
                'downloads':   67,
            },
            {
                'title':       'Carte administrative officielle Congo',
                'description': 'Carte administrative du Congo-Brazzaville '
                               'format A0 300dpi. Source IGC 2023.',
                'category':    categories['cartes'],
                'department':  departments['nat'],
                'format':      'pdf',
                'projection':  'EPSG:4326',
                'licence':     'open',
                'file_url':    'https://example.com/carte_admin_congo_2023.pdf',
                'file_size_mb': 18.0,
                'status':      'approved',
                'downloads':   320,
            },
            {
                'title':       'Limites communes — Pool',
                'description': 'Shapefile des communes du département '
                               'du Pool. En attente de validation.',
                'category':    categories['admin'],
                'department':  departments['pool'],
                'format':      'shp',
                'projection':  'EPSG:4326',
                'licence':     'open',
                'file_url':    'https://example.com/communes_pool.shp',
                'file_size_mb': 3.1,
                'status':      'pending',
                'downloads':   0,
            },
        ]

        created = 0
        for d in datasets:
            obj, was_created = Dataset.objects.get_or_create(
                title=d['title'],
                defaults={**d, 'contributor': admin}
            )
            if was_created:
                created += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'\nTerminé ! {created} datasets créés, '
                f'{len(categories)} catégories, '
                f'{len(departments)} départements.'
            )
        )