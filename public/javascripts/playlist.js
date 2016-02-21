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


function populateListElements(data, isSearch){
  // isSearch is a boolean which is true if the item is a search item
  // Data is a json type argument
  // [{
  //    name: String for the name of the song
  //    id: String for the id of the song (in youtube)
  //    _id: (optional) String for the id of the object in Mongodb
  //    votes: (optional) An number for the number of votes
  // }]
  //
  // Want this to work for populating the page and for the search elms
  // So the page population ones will have a votes and the song _id
  
  // Would it be possible to create a long string of html then sprintf it?
  // It probably would be, but would it be more efficient?


  // Encapsulating div
  var newContainer = $(document.createElement('div'));
  newContainer.addClass('collection z-depth-1');

  if(!isSearch){
    newContainer = $('#songItems');
  }


  $.each(data, function(i, item) {
    var elm = null;

    // The data is different depending on the source
    if (isSearch){
      var name = item.snippet.title;
      var yid = item.id.videoId;
    
      elm = createListElement(name, yid, null, null);
    }
    else{
      var item = item.items;

      var name = item.get('name');
      var yid = item.get('id');
      var _id = item.get('_id');
      var votes = item.get('votes');

      // This will be the video that should be played
      // TODO ill probably have some other logic for this (socketry)
      if (i == 0){
        var videoContainer = '<div class="col s8">'
          + ' <div class="center-align" id="player-container">'
          + ' <div id="player", data-vid_id="' + yid + '">'
          + ' </div> </div> </div>'
        $('body').append(videoContainer);
        
        // This is the same as a 'continue' statement
        return true;
      }
      else{
        elm = createListElement(name, yid, _id, votes);
      }
    }

    // Add the element to the container
    newContainer.append(elm);

    // Search needs to be appended to the dom, 
    // non-search does not (newContainer is on dom)
    if (isSearch){
      $('#searchBox').append(newContainer);
    }
  });
}

function createListElement(name, yid, _id, votes){
  // The list element
  var elm = $(document.createElement('li'));
  elm.addClass('collection-item valign-wrapper');
    
  if (_id) elm.attr('id', _id);


  // create and add the thumbnail object
  var thumbnail = '<div class="col s4">'
    + '<img id="thumbnail" class="responsive-img" src="http://img.youtube.com/vi/'
    + yid + '/default.jpg"></div>';
  elm.append(thumbnail);

  // create and add the song name label
  var songname = '<div class="col s4"> <p id="songname"> ' + name + ' </p> </div>';
  elm.append(songname);

  // add in the buttons and votes to non-search elements
  // Use the presence of an _id tag to differentiate
  if (_id){
    var votes = '<div class="col s4"> <p id="vote_val"> ' + votes + '</p> </div>';
    elm.append(votes);

    var ratecontainer = '<div class="col s2">'
      + ' <div class="row"> <button class="btn-floating green darken-4 vote"'
      + ' id="like" data-song_id="' + _id + '">'
      + ' <i class="material-icons thumb_up"> </i> </button> </div>'
      + ' <div class="col s2"> <button class="btn-floating red darken-4 vote"'
      + ' id="dislike" data-song_id="' + _id + '">'
      + ' <i class="material-icons thumb_down"> </i> </button> </div> </div>'
    elm.append(ratecontainer);
  }
  else{
    elm.click(function(){
      var data = {};
      data.yid = yid;
      data.name = name;
      
      console.log("socket sent new_song");
      socket.emit("new_song", data);
    });
  }

  return elm;
}

$( document ).ready(function() {
  $('#search').keypress(function (e) {
    if (e.which == 13) {
      var query = $(this).val();
      var api_key = "AIzaSyCmn8BkTbc1FOA6Z8yIBDDvsEf-e8Btfo0";

      var queryString = "https://www.googleapis.com/youtube/v3/search?part=id%2Csnippet"
      queryString += "&q=" + query + "&key=" + api_key;
      console.log(queryString);

      $.get( queryString, function( response ) {
        var response = response.items;
        populateListElements(response, true);
      });

      return false;
    }
  });

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
  });

  // ------- SOCKET STUFF ------- \\
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
    console.log("socket received next song for[" + song_id + "]");
    player.loadVideoById(song_id);
  })

  // New element message
  socket.on("new_song", function(data) {
    console.log("socket received new song for[" + song_id + "]");


  })
});
