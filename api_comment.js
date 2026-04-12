const { posts } = require("../data");

export default function handler(req, res) {
  const { postId, comment } = req.body;

  const post = posts.find(p => p.id === postId);

  if (post) {
    post.comments.push(comment);
    return res.status(200).json(post);
  }

  res.status(200).json({ message: "Comment added" });
}
