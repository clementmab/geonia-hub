# Generated manually for adding dataset_type to Dataset model

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('datasets', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='dataset',
            name='dataset_type',
            field=models.CharField(choices=[('pre_produced', 'Carte pré-produite'), ('new', 'Nouveau dataset')], default='new', max_length=20, verbose_name='Type de dataset'),
        ),
    ]