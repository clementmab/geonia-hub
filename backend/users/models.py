from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver


class UserProfile(models.Model):
    USER_TYPES = [
        ('contributeur', 'Contributeur'),
        ('ong', 'ONG/Mairie'),
        ('etudiant', 'Étudiant'),
        ('particulier', 'Particulier'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    user_type = models.CharField(
        max_length=20,
        choices=USER_TYPES,
        default='particulier',
        verbose_name='Type d\'utilisateur'
    )
    bio = models.TextField(blank=True, verbose_name='Biographie')
    organization = models.CharField(max_length=100, blank=True, verbose_name='Organisation')
    phone = models.CharField(max_length=20, blank=True, verbose_name='Téléphone')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Profil utilisateur'
        verbose_name_plural = 'Profils utilisateurs'

    def __str__(self):
        return f"{self.user.username} - {self.get_user_type_display()}"


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()
