//TODO I really don't like how this loads... its all laggy and jumpy
// probably can be fixed with better html stylings
// 2. This code loads the IFrame Player API code asynchronously.
var tag = document.createElement('script');

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// 3. This function creates an <iframe> (and YouTube player)
//    after the API code downloads.
var player;
function onYouTubeIframeAPIReady() {
  player = new YT.Player('player', {
    height: '390',
    width: '640',
    videoId: $('#player').data('vid_id'),
    events: {
      'onReady': onPlayerReady,
      'onStateChange': onPlayerStateChange
    }
  });
}

// 4. The API will call this function when the video player is ready.
function onPlayerReady(event) {
  event.target.playVideo();
}

// 5. The API calls this function when the player's state changes.
//    The function indicates that when playing a video (state=1),
//    the player should play for six seconds and then stop.
var done = false;
function onPlayerStateChange(event) {
  if (event.data == YT.PlayerState.PLAYING && !done) {
    setTimeout(stopVideo, 6000);
    done = true;
  }
}
function stopVideo() {
  player.stopVideo();
}

$( document ).ready(function() {
    $('#like').on('click', function(){
      // There might be a better way to store this information
      // Especially the playlist id... seems redundant
      var data = {};
      // Have to remove the double quotes... most annoying error ever
      data.playlist_id = $(this).data('playlist_id').replace(/\"/g, "");
      data.song_id = $(this).data('song_id').replace(/\"/g, "");
      $.ajax({
        type: 'POST',
        contentType: 'application/json',
        url: '/playlist/song/vote',
        data: JSON.stringify(data),
        async: true,
        statusCode: {
          200: function(data) {
            console.log(data);
          },
          400: function(data) {
            console.log(data);
            alert("Didn't work");
          }
        }
      });

    });
});

