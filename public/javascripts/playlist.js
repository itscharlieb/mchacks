//TODO I really don't like how this loads... its all laggy and jumpy
// probably can be fixed with better html stylings
// 2. This code loads the IFrame Player API code asynchronously.
var socket = io();
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
  if(event.data == 0){
    console.log("socket sending next song request");
    socket.emit('next_song');
  }
  //if (event.data == YT.PlayerState.PLAYING && !done) {
  //  setTimeout(stopVideo, 6000);
  //  done = true;
  //}
  // if (event.data == 0){
  //   $.ajax({
  //     type: 'POST',
  //     contentType: 'application/json',
  //     url: '/playlist/next',
  //     async: true,
  //     statusCode: {
  //       200: function(nextSong) {
  //         console.log(nextSong);
  //         player.loadVideoById(nextSong);
  //       },
  //       400: function(data) {
  //         console.log(data);
  //         alert("Didn't work");
  //       }
  //     }
  //
  //   });
  // }
}
function stopVideo() {
  player.stopVideo();
}

$( document ).ready(function() {
  socket.on("init", function(song_id){
    console.log("socket received init for [" + song_id + "]");
    player.loadVideoById(song_id);
  })

  //like message
  socket.on("like", function(song_id){
    console.log("socket received like for [" + song_id + "]");
    var vote_obj = $("#" + song_id).find('#vote_val');
    vote_obj.text(parseInt(vote_obj.text()) + 1);
  });

  //dislike message
  socket.on("dislike", function(song_id){
    console.log("socket received dislike for [" + song_id + "]");
    var vote_obj = $("#" + song_id).find('#vote_val');
    console.log(vote_obj.text());
    vote_obj.text(parseInt(vote_obj.text()) - 1);
  })

  //next song message
  socket.on("next_song", function(song_id) {
    console.log("socket received load video if for[" + song_id + "]");
    player.loadVideoById(song_id);
  })

  $('.vote').on('click', function(){
    // There might be a better way to store this information
    // Especially the playlist id... seems redundant
    var data = {};

    // Have to remove the double quotes... most annoying error ever
    data.song_id = $(this).data('song_id').replace(/\"/g, "");
    // var vote_obj = $(this).parent().parent().parent().find("#vote_val");

    if($(this).attr("id") == "like"){
      console.log("socket sent like");
      socket.emit("like", data.song_id);
    }
    else{
      console.log("socket sent dislike");
      socket.emit("dislike", data.song_id);
    }

    // $(this).attr("id") == "like" ? data.inc = 1 : data.inc = -1;
    // $.ajax({
    //   type: 'POST',
    //   contentType: 'application/json',
    //   url: '/playlist/song/vote',
    //   data: JSON.stringify(data),
    //   async: true,
    //   statusCode: {
    //     200: function(retval) {
    //       console.log(retval);
    //       vote_obj.text(parseInt(vote_obj.text()) + parseInt(retval));
    //     },
    //     400: function(data) {
    //       console.log(data);
    //       alert("Didn't work");
    //     }
    //   }
    // });

  });
  $('#search').keypress(function (e) {
    if (e.which == 13) {
      var query = $(this).val();
      var api_key = "AIzaSyCmn8BkTbc1FOA6Z8yIBDDvsEf-e8Btfo0";

      var queryString = "https://www.googleapis.com/youtube/v3/search?part=id%2Csnippet"
      queryString += "&q=" + query + "&key=" + api_key;
      console.log(queryString);
      $.get( queryString, function( response ) {
        // TODO should probably do this as all strings like the newContainer
        // Best to make this scrollable instead of the entire card
        var newContainer = $('<div class="collection z-depth-1">')
        var templateElm = $('<li class="collection-item valign-wrapper">'
          + '<div class="col s4"> <img id="thumbnail" class="responsive-img"></div>'
          + '<div class="col s4"> <p id="songName"> </p> </div>'
          + '</li>');
        var response = response.items;


        $.each(response, function(i, item) {
          var newElm = templateElm.clone();
          newElm.data('vidId', item.id.videoId);
          newElm.find('#thumbnail').attr('src', item.snippet.thumbnails.default.url);
          newElm.find('#songName').text(item.snippet.title);
          newElm.click(function(){
            var data = {};
            data.songId = $(this).data('vidId');
            data.songName = $(this).find('#songName').text();
            $.ajax({
              type: 'POST',
              contentType: 'application/json',
              url: '/playlist/add',
              data: JSON.stringify(data),
              async: true,
              statusCode: {
                200: function(playlist_id) {
                  console.log(playlist_id);
                  window.location.replace("/playlist/" + playlist_id);
                },
                400: function(data) {
                  console.log(data);
                  alert("Didn't work");
                }
              }
            });
            $(this).parent().remove();
          });
          newContainer.append(newElm);
          // What to append to
        });

        newContainer.append("</div>");
        $('#searchBox').append(newContainer);
      });

      return false;
    }
  });
});
