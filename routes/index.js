var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var $ = require('jQuery');


mongoose.connect('mongodb://localhost/McHacks', function (error) {
  if (error) {
      console.log(error);
  }
  else{
    console.log('Successfully Connected');
  }
});

var conn = mongoose.connection
var Schema = mongoose.Schema;


// TODO perhaps change to playlist_name, song_name, and song_id
//    This is rather confusing
// Consider putting in a "last_played"
var PlaylistSchema = new Schema({
    name: String,
    // creator: mongoose.Schema.Types.ObjectId,     // Not needed for now
    items: [{
      id: String,                                   // Unique id in system used
      url: String,                                  // URL of the item... not really needed with id
      name: String,
      artist: String,
      votes: Number,
    }]
});


var Playlist = mongoose.model('playlist', PlaylistSchema);

Playlist.find().count(function(err, count){
  if (err){
    console.log(err)
  }
  else if (count == 0){
    new Playlist({
      name: 'decent playlist',
      items: [{
        id: 'TNtIA2fgHfg',
        url: 'https://www.youtube.com/watch?v=TNtIA2fgHfg',
        name: 'Peking Duk ft. Nicole Millar - "High" (Official Video)',
        artist: 'THUMP',
        votes: 5,
      },{
        id: '_SKLcIxPHWA',
        url: 'https://www.youtube.com/watch?v=_SKLcIxPHWA',
        name: 'Palastic - Far Away (feat. Josh Roa)',
        artist: 'MrSuicideSheep',
        votes: 8,
      },{
        id: 'YZKN73_0xtI',
        url: 'https://www.youtube.com/watch?v=YZKN73_0xtI',
        name: 'Vanic x K.Flay - Cops',
        artist: 'Trap City',
        votes: 5,
      },{
        id: 'n09oiii8hO4',
        url: 'https://www.youtube.com/watch?v=n09oiii8hO4',
        name: 'Major Lazer - Be Together (feat. Wild Belle) (Vanic Remix)',
        artist: 'Trap City',
        votes: 3,
      }]
    }).save(function(err, saved){
      if (err) console.log(err);
    });
  }
});

/* GET home page. */
router.get('/', function(req, res, next) {
  // Exclude the songs cause they are unnecessary on main page
  //    They will only slow down the load times
  Playlist.find({}, {items: 0}, function(err,playlists){
    if (err){
      console.log(err);
      res.status(500).send(err);
    }
    else{
      res.render('index', { title: 'Index', playlists: playlists });
    }
  });
});

var playlist_id = null;
router.get('/playlist/:id', function(req, res, next) {
  playlist_id = req.params.id;


  // Seems like a rather inefficient way of doing things...
  // TODO revamp this query, must be a way of sorting easier
  Playlist.aggregate([{'$match': {'_id': mongoose.Types.ObjectId(playlist_id)}},
                      {'$unwind': '$items'}, {'$sort': {'items.votes': -1}},
                    ]).exec(function(err, playlist){
    if (err){
      console.log(err);
      res.status(500).send(err);
    }
    else{
      if (playlist.length != 0){
        var song_id = playlist[0].items._id;
        Playlist.findOneAndUpdate({"items._id": song_id}, {"$set": {"items.$.votes":0}}, function(err, response){
          if (err) console.log(err);
        });
        res.render('playlist', { playlist:playlist });
      }
      res.render('playlist', { });
    }
  });
});


router.post('/playlist/create', function(req, res){
  new Playlist({'name': req.body.playlist_name}).save(function(err, response){
    if (err){
      console.log(err)
      res.status(500).send(err);
    }
    else{
      console.log(JSON.stringify(response));
      playlist_id = response._id;
      res.render('playlist', { });
    }
  });
});





router.post('/playlist/song/vote', function(req, res){
  var song_id = req.body.song_id;
  // Playlist.aggregate([{ $unwind : "$items" }, { $match : {_id: song_id}}]).exec(function(err, response){
  Playlist.findOneAndUpdate({"items._id": song_id}, {"$inc": {"items.$.votes":req.body.inc}}, function(err, response){
    if (err){
      console.log(err);
      res.status(500).send(err);
    }
    else{
      console.log(JSON.stringify(response));

      router.io.emit('like', song_id)
      // TODO check if user has already voted on this
      // Check if it worked, if it did then send the incrementation back...
      // If it didn't (like if the user already voted) send back a 0
      res.status(200).send(JSON.stringify(req.body.inc));
    }
  });
});



router.post('/playlist/add', function(req, res){
  Playlist.findByIdAndUpdate(mongoose.Types.ObjectId(playlist_id),
                              {"$addToSet": {'items':
                                              {'id': req.body.songId,
                                               'name': req.body.songName,
                                               'votes': 0}
                                            }}, function(err,response){

    if (err){
      console.log(err);
      res.status(500).send(err);
    }
    else{
      // Don't really need to pass anything... would be cooler to do this
      // without reloading the page though..
      res.status(200).send(playlist_id);
    }
  });
});

module.exports = function(io){
  router.io = io;

router.io.on('connection', function(socket) {
  socket.join(playlist_id);
  console.log('socket connection');

  // On init logic
  // Need a way of getting timestamp logic



  // TODO Should probably compress like and dislike into one data object
  socket.on('like', function(data){
    console.log("like emitted");
    Playlist.findOneAndUpdate({"items._id": mongoose.Types.ObjectId(data)}, {"$inc": {"items.$.votes":1}}, function(err, response){
      if (err){
        console.log(err);
        res.status(500).send(err);
      }
      else{
        // TODO fix this response_data later
        // Essentially want the db value to maintain persistence
        var response_data = {};
        response_data.song_id = data;
        // For whatever reason it does not respond with the updated version
        response_data.votes = response.items.votes+1;
        router.io.sockets.in(playlist_id).emit('like', data);
      }
    });
  });
  socket.on('dislike', function(data){
    console.log("dislike emitted");
    Playlist.findOneAndUpdate({"items._id": data}, {"$inc": {"items.$.votes":-1}}, function(err, response){
      if (err){
        console.log(err);
        res.status(500).send(err);
      }
      else{
        // TODO fix this response_data later
        // Essentially want the db value to maintain persistence
        var response_data = {};
        response_data.song_id = data;
        // For whatever reason it does not respond with the updated version
        response_data.votes = response.items.votes-1;
        router.io.sockets.in(playlist_id).emit('dislike', data);
      }
    });
  });
  socket.on('next_song', function(){
    console.log("next_song emitted");
    console.log(playlist_id);
    Playlist.aggregate([{'$match': {'_id': mongoose.Types.ObjectId(playlist_id)}},
                        {'$project': {'items':'$items', '_id':0}},
                        {'$unwind': '$items'}, {'$sort': {'items.votes': -1}},
                        {'$limit': 1}]).exec(function(err, response){
      if (err){
        console.log(err);
        res.status(500).send(err);
      }
      else{
        var song_id = response[0].items._id;
        Playlist.findOneAndUpdate({"items._id": song_id}, {"$set": {"items.$.votes":0}}, function(err, response){
          if (err) console.log(err);
        });
        // TODO need to set the current playing votes to 0
        router.io.sockets.in(playlist_id).emit('next_song', response[0].items.id);
      }
    });
  });
  
  socket.on('disconnect', function () {
    console.log('disconnected event');
    //socket.manager.onClientDisconnect(socket.id); --> endless loop with this disconnect event on server side
    socket.disconnect();
  });
  
});
//add user to socket room
// router.io.join('test');

  return router;
}




