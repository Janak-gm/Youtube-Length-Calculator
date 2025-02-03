const API_KEY = "AIzaSyBn5bpfGb8JSYFCg76rmkcEAv5puxsCvBw"; 

// Extracts YouTube Video/Playlist ID from URL 
function extractYouTubeId(url) {
    let match = url.match(/(?:v=|list=|\/)([0-9A-Za-z_-]{11,})/);
    return match ? match[1] : null;
}



// Converts ISO 8601 duration (PT#H#M#S) to total seconds
function parseDuration(duration) {
    let match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    let hours = parseInt(match[1]) || 0;
    let minutes = parseInt(match[2]) || 0;
    let seconds = parseInt(match[3]) || 0;
    return hours * 3600 + minutes * 60 + seconds;
}

// Formats time from seconds to HH:MM:SS
function formatTime(seconds) {
    let hours = Math.floor(seconds / 3600);
    let minutes = Math.floor((seconds % 3600) / 60);
    let secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
}

// Calculates total length of video or playlist
async function calculateLength() {
    let inputUrl = document.getElementById("youtubeId").value.trim();
    let youtubeId = extractYouTubeId(inputUrl);
    let resultDiv = document.getElementById("result");

    if (!youtubeId) {
        resultDiv.innerHTML = "❌ Invalid YouTube URL.";
        return;
    }

    resultDiv.innerHTML = "⏳ Fetching data...";

    try {
        // Fetch video details (single video case)
        let videoResponse = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=${youtubeId}&key=${API_KEY}`);
        let videoData = await videoResponse.json();

        if (videoData.items.length > 0) {
            let video = videoData.items[0];
            let duration = parseDuration(video.contentDetails.duration);
            let creatorName = video.snippet.channelTitle;
            displayResults(duration, creatorName);
            return;
        }

        // Fetch playlist details (if not a single video)
        let playlistResponse = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&playlistId=${youtubeId}&maxResults=50&key=${API_KEY}`);
        let playlistData = await playlistResponse.json();

        if (playlistData.items.length > 0) {
            let totalDuration = 0;
            let videoCount = 0;
            let creatorName = "";
            
            // Fetch durations for all videos in the playlist
            for (let item of playlistData.items) {
                let videoId = item.contentDetails.videoId;
                let videoDetailsResponse = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=${videoId}&key=${API_KEY}`);
                let videoDetailsData = await videoDetailsResponse.json();

                if (videoDetailsData.items.length > 0) {
                    let video = videoDetailsData.items[0];
                    totalDuration += parseDuration(video.contentDetails.duration);
                    videoCount++;
                    if (!creatorName) {
                        creatorName = video.snippet.channelTitle;
                    }
                }
            }

            let averageDuration = totalDuration / videoCount;
            displayResults(totalDuration, creatorName, averageDuration);
            return;
        }

        resultDiv.innerHTML = "❌ Invalid YouTube ID or Playlist.";
    } catch (error) {
        resultDiv.innerHTML = "⚠ Error fetching data. Please try again!";
        console.error(error);
    }
}

// Display results with different playback speeds and average video length for playlists
function displayResults(duration, creatorName, averageDuration = null) {
    let resultDiv = document.getElementById("result");
    resultDiv.innerHTML = `
        <p>🎥 Total Length: <strong>${formatTime(duration)}</strong></p>
        <p>Creator: <strong>${creatorName}</strong></p>
        ${averageDuration ? `<p>📏 Average Video Length: <strong>${formatTime(averageDuration)}</strong></p>` : ""}
        <p>⏩ 1.25x Speed: <strong>${formatTime(Math.round(duration / 1.25))}</strong></p>
        <p>⏩ 1.5x Speed: <strong>${formatTime(Math.round(duration / 1.5))}</strong></p>
        <p>⏩ 2x Speed: <strong>${formatTime(Math.round(duration / 2))}</strong></p>
    `;
}
// Toggle Dark Mode
const toggleDarkMode = () => {
    const body = document.body;
    body.classList.toggle('dark-mode');
    
    // Update button text and store the preference
    const darkModeButton = document.getElementById('darkModeToggle');
    if (body.classList.contains('dark-mode')) {
        darkModeButton.textContent = "🌞 Switch to Light Mode";
        localStorage.setItem('dark-mode', 'enabled');
    } else {
        darkModeButton.textContent = "🌙 Switch to Dark Mode";
        localStorage.setItem('dark-mode', 'disabled');
    }
}

// Enable dark mode by default (optional)
document.addEventListener("DOMContentLoaded", () => {
    if (localStorage.getItem('dark-mode') === 'enabled') {
        document.body.classList.add('dark-mode');
        document.getElementById('darkModeToggle').textContent = "🌞 Switch to Light Mode";
    } else {
        document.getElementById('darkModeToggle').textContent = "🌙 Switch to Dark Mode";
    }
});
