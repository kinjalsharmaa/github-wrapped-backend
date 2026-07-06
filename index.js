const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());

app.get('/', (req, res) => {
  res.send('GitHub Wrapped backend is running!');
});

// New route: fetch a GitHub user's stats
app.get('/api/github/:username', async (req, res) => {
  const { username } = req.params;

  try {
    // 1. Get basic profile info
    const userRes = await fetch(`https://api.github.com/users/${username}`);
    if (!userRes.ok) {
      return res.status(404).json({ error: 'GitHub user not found' });
    }
    const userData = await userRes.json();

    // 2. Get their repos (up to 100, sorted by most recently updated)
    const reposRes = await fetch(
      `https://api.github.com/users/${username}/repos?per_page=100&sort=updated`
    );
    const reposData = await reposRes.json();

    // 3. Count languages across all repos
    const languageCounts = {};
    reposData.forEach((repo) => {
      if (repo.language) {
        languageCounts[repo.language] = (languageCounts[repo.language] || 0) + 1;
      }
    });

    // 4. Find most starred repo
    const topRepo = reposData.length > 0
      ? reposData.reduce((max, repo) => {
          return repo.stargazers_count >= (max?.stargazers_count || 0) ? repo : max;
        }, reposData[0])
      : null;

    res.json({
      username: userData.login,
      avatar: userData.avatar_url,
      name: userData.name,
      bio: userData.bio,
      followers: userData.followers,
      following: userData.following,
      publicRepos: userData.public_repos,
      accountCreated: userData.created_at,
      languageCounts,
      topRepo: topRepo
        ? { name: topRepo.name, stars: topRepo.stargazers_count, url: topRepo.html_url }
        : null,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong fetching GitHub data' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
