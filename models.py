from django.db import models

class Post(models.Model):
    image_url = models.URLField()
    created_at = models.DateTimeField(auto_now_add=True)

class Like(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="likes")
    user_id = models.CharField(max_length=100)

class View(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="views")
    user_id = models.CharField(max_length=100)

class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="comments")
    user_id = models.CharField(max_length=100)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
