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

// TODO error handling
  player.addEventListener("onError", function(errorcode) {
    // 2: request contains an invalid parameter value
    // 100: the video was not found
    // 101: the owner does not want video played in embedded players
    // 150: same as a 101
    console.log(errorcode);
    if(errorcode == 100){
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

  if(isSearch){
    newContainer.attr('id', 'searchResults');
  }
  else{
    newContainer = $('#songItems');
  }

  $.each(data, function(i, item) {
    var elm = null;

    // The data is different depending on the source
    if (isSearch){
      var name = item.snippet.title;
      var yid = item.id.videoId;
    
      elm = createListElement(name, yid, null);
    }
    else{
      var item = item.items;

      var name = item.get('name');
      var yid = item.get('id');
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
        elm = createListElement(name, yid, votes);
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

function createListElement(name, yid, votes){
  // The list element
  var elm = $(document.createElement('li'));
  elm.css({"cursor": "pointer"});
  elm.addClass('collection-item valign-wrapper');
    
  elm.attr('id', yid);


  // create and add the thumbnail object
  var thumbnail = '<div class="col s2">'
    + '<img id="thumbnail" class="responsive-img" src="http://img.youtube.com/vi/'
    + yid + '/default.jpg"></div>';
  elm.append(thumbnail);

  // create and add the song name label
  var songname = '<div class="col s4"> <p id="songname"> ' + name + ' </p> </div>';
  elm.append(songname);

  // add in the buttons and votes to non-search elements
  // Use the presence of an _id tag to differentiate
  if (votes !== null){
    var votes = '<div class="col s4"> <p id="vote_val"> ' + votes + '</p> </div>';
    elm.append(votes);

    var ratecontainer = '<div class="col s2">'
      + ' <div class="row"> <button class="btn-floating green darken-4 vote"'
      + ' id="like" data-song_id="' + yid + '">'
      + ' <i class="material-icons"> thumb_up </i> </button> </div>'
      + ' <div class="col s2"> <button class="btn-floating red darken-4 vote"'
      + ' id="dislike" data-song_id="' + yid + '">'
      + ' <i class="material-icons"> thumb_down </i> </button> </div> </div>'
    elm.append(ratecontainer);
  }
  else{
    // The functionality for Search elements
    // Want to clear the search list and add the song to the playlist on click
    elm.click(function(){
      var data = {};
      data.yid = yid;
      data.name = name;
      
      $('#searchResults').remove();

      console.log("socket sent new_song");
      socket.emit("new_song", data);
    });
  }

  return elm;
}

// -------------------- SEARCH FUNCTION -------------------- \\
$( document ).ready(function() {
  // Delete results on search clear
  $('#search').keyup(function (e) {
    if ($(this).val() == ""){
      $("#searchResults").remove();
    }
  });

  // Searching on enter
  $('#search').keypress(function (e) {
    if (e.which == 13) {
      searchYoutube();
      return false;
    }
  });

  // Searching on button press
  $('#searchBtn').on('click', function(){
    searchYoutube();
  });

  function searchYoutube(){
    var query = $('#search').val();
    // TODO Do we really want to keep this here?
    var api_key = "AIzaSyCmn8BkTbc1FOA6Z8yIBDDvsEf-e8Btfo0";

    // Will most probably have to sanitize the inputs 
    // Things like & in the query string will likely mess up results
    var queryString = "https://www.googleapis.com/youtube/v3/search?part=id%2Csnippet"
    // We only want results of type video, don't want playlists or channels
    queryString += "&type=video";
    queryString += "&q=" + query;
    queryString += "&key=" + api_key;
    console.log(queryString);

    $.get( queryString, function( response ) {
      $('#searchResults').remove();

      var response = response.items;
      console.log(response);
      populateListElements(response, true);
    });
  }


  $('.vote').on('click', function(){
    // There might be a better way to store this information
    // Especially the playlist id... seems redundant
    var data = {};

    // Have to remove the double quotes... most annoying error ever
    data.song_id = $(this).data('song_id').replace(/\"/g, "");
    JSON.stringify(data);
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
    console.log(vote_obj.text());
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
  // TODO add error logic if the item already exists
  socket.on("new_song", function(data) {
    console.log("socket received new song for[" + data.yid + "]");
    // TODO consider adding a cool highlight fadeout
    // so users can easily see what they have added
    var song_elm = createListElement(data.name, data.yid, 0)
    $('#songItems').append(song_elm);
  })
});
