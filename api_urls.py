from django.urls import path
from . import views

urlpatterns = [
    path("posts/", views.get_posts),
    path("posts/create/", views.create_post),
    path("posts/<int:post_id>/like/", views.toggle_like),
    path("posts/<int:post_id>/comment/", views.add_comment),
    path("posts/<int:post_id>/view/", views.add_view),
]
