const { posts } = require("../data");

export default function handler(req, res) {
  const { postId } = req.body;

  const post = posts.find(p => p.id === postId);

  if (post) {
    post.likes += 1;
    return res.status(200).json(post);
  }

  res.status(404).json({ message: "Post not found" });
}
