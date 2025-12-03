// api/me.js

export default async function handler(req, res) {
  // In a real app, you’d look at cookies / tokens here and fetch user from a DB.
  // For now, we just mock a Mastery user so you can test the flow.

  const mockUser = {
    loggedIn: true,
    plan: "mastery", // change to "free" to simulate free users
    email: "student@example.com"
  };

  res.status(200).json(mockUser);
}

