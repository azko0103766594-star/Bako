const { posts } = require("../data");

export default function handler(req, res) {
  if (req.method === "POST") {
    const { text } = req.body;

    const newPost = {
      id: Date.now(),
      text,
      likes: 0,
      comments: []
    };

    posts.push(newPost);

    return res.status(200).json(newPost);
  }

  res.status(405).json({ message: "Method not allowed" });
}
