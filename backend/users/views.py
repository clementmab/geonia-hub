from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.conf import settings
from .models import UserProfile
from .serializers import (
    UserRegistrationSerializer,
    UserSerializer,
    UserProfileSerializer,
    UserProfileUpdateSerializer
)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Envoyer un email de notification
        self.send_registration_email(user)

        # Générer les tokens JWT
        refresh = RefreshToken.for_user(user)
        tokens = {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }

        return Response({
            'user': UserSerializer(user).data,
            'tokens': tokens,
            'message': 'Inscription réussie !'
        }, status=status.HTTP_201_CREATED)

    def send_registration_email(self, user):
        """Envoyer un email de notification pour nouvelle inscription"""
        subject = f"Nouvelle inscription sur GéoNia Data Hub"
        message = f"""
Un nouvel utilisateur s'est inscrit sur GéoNia Data Hub :

Informations de l'utilisateur :
- Nom d'utilisateur : {user.username}
- Email : {user.email}
- Prénom : {user.first_name}
- Nom : {user.last_name}
- Type d'utilisateur : {user.profile.user_type}
- Date d'inscription : {user.profile.created_at.strftime('%d/%m/%Y %H:%M')}

Cordialement,
L'équipe GéoNia Data Hub
        """
        
        try:
            send_mail(
                subject=subject,
                message=message,
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@geonia.com'),
                recipient_list=['geonia.tec@gmail.com'],
                fail_silently=False,
            )
        except Exception as e:
            # Logger l'erreur mais ne pas bloquer l'inscription
            print(f"Erreur lors de l'envoi de l'email: {e}")


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        user = self.get_object()
        user_serializer = UserSerializer(user, data=request.data, partial=True)
        profile_serializer = UserProfileUpdateSerializer(user.profile, data=request.data, partial=True)

        user_valid = user_serializer.is_valid()
        profile_valid = profile_serializer.is_valid()

        if user_valid and profile_valid:
            user_serializer.save()
            profile_serializer.save()
            return Response({
                'user': user_serializer.data,
                'message': 'Profil mis à jour avec succès.'
            })
        else:
            errors = {}
            if not user_valid:
                errors.update(user_serializer.errors)
            if not profile_valid:
                errors.update(profile_serializer.errors)
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)


class UserContributionsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        from datasets.models import Dataset  # Import here to avoid circular import
        contributions = Dataset.objects.filter(contributor=user).order_by('-created_at')
        data = []
        for dataset in contributions:
            data.append({
                'id': dataset.id,
                'title': dataset.title,
                'status': dataset.status,
                'created_at': dataset.created_at,
                'downloads': dataset.downloads,
            })
        return Response({
            'contributions': data,
            'total': len(data)
        })
