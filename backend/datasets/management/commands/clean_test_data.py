from django.core.management.base import BaseCommand
from datasets.models import Dataset


class Command(BaseCommand):
    help = 'Supprimer les données de test du catalogue'

    def handle(self, *args, **kwargs):
        self.stdout.write('Suppression des datasets de test...')

        # Liste des titres des datasets de test à supprimer
        test_titles = [
            'Limites départements Congo 2024',
            'MNT SRTM 30m — Brazzaville',
            'Routes OSM — Pointe-Noire',
            'Bâtiments OSM — Brazzaville',
            'Hydrographie — Bassin Kouilou-Niari',
            'Couverture forestière Congo 2023',
            'Carte administrative officielle Congo',
            'Limites communes — Pool',
        ]

        deleted_count = 0
        for title in test_titles:
            try:
                dataset = Dataset.objects.get(title=title)
                dataset.delete()
                deleted_count += 1
                self.stdout.write(f'Supprimé: {title}')
            except Dataset.DoesNotExist:
                self.stdout.write(f'Non trouvé: {title}')

        self.stdout.write(
            self.style.SUCCESS(f'\nTerminé ! {deleted_count} datasets de test supprimés.')
        )