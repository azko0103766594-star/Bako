from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import Post, Like, View, Comment
import json

@csrf_exempt
def create_post(request):
    if request.method == "POST":
        data = json.loads(request.body)
        post = Post.objects.create(image_url=data["image_url"])
        return JsonResponse({"id": post.id})

def get_posts(request):
    posts = Post.objects.all().order_by("-created_at")
    data = []

    for p in posts:
        data.append({
            "id": p.id,
            "image_url": p.image_url,
            "likes": p.likes.count(),
            "views": p.views.count(),
            "comments": [
                {"user": c.user_id, "text": c.text}
                for c in p.comments.all()
            ]
        })

    return JsonResponse(data, safe=False)

@csrf_exempt
def toggle_like(request, post_id):
    if request.method == "POST":
        data = json.loads(request.body)
        user_id = data["user_id"]
        post = Post.objects.get(id=post_id)

        like = Like.objects.filter(post=post, user_id=user_id)
        if like.exists():
            like.delete()
        else:
            Like.objects.create(post=post, user_id=user_id)

        return JsonResponse({"likes": post.likes.count()})

@csrf_exempt
def add_comment(request, post_id):
    if request.method == "POST":
        data = json.loads(request.body)
        post = Post.objects.get(id=post_id)
        Comment.objects.create(
            post=post,
            user_id=data["user_id"],
            text=data["text"]
        )
        return JsonResponse({"success": True})

@csrf_exempt
def add_view(request, post_id):
    if request.method == "POST":
        data = json.loads(request.body)
        post = Post.objects.get(id=post_id)
        View.objects.get_or_create(
            post=post,
            user_id=data["user_id"]
        )
        return JsonResponse({"views": post.views.count()})
