// Render-
async function loadVideos(query='') {
  const res = await fetch('/videos?q=' + query);
  const videos = await res.json();
  const container = document.getElementById('video-list');
  if (!container) return;

  container.innerHTML = videos.map(v => `
    <div class="video-card">
      <h3>${v.title}</h3>
      <p>${v.description}</p>
      <p>By: ${v.author}</p>
      <video width="320" height="240" controls src="data:${v.mimeType};base64,${v.data}"></video>
    </div>
  `).join('');
}
