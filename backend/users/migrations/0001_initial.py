# Generated manually for UserProfile model

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('auth', '0012_alter_user_first_name_max_length'),
    ]

    operations = [
        migrations.CreateModel(
            name='UserProfile',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('user_type', models.CharField(choices=[('contributeur', 'Contributeur'), ('ong', 'ONG/Mairie'), ('etudiant', 'Étudiant'), ('particulier', 'Particulier')], default='particulier', max_length=20, verbose_name='Type d\'utilisateur')),
                ('bio', models.TextField(blank=True, verbose_name='Biographie')),
                ('organization', models.CharField(blank=True, max_length=100, verbose_name='Organisation')),
                ('phone', models.CharField(blank=True, max_length=20, verbose_name='Téléphone')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='profile', to='auth.user')),
            ],
            options={
                'verbose_name': 'Profil utilisateur',
                'verbose_name_plural': 'Profils utilisateurs',
            },
        ),
    ]