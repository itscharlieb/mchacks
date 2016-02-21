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
      var song_id = playlist[0].items._id;
      Playlist.findOneAndUpdate({"items._id": song_id}, {"$set": {"items.$.votes":0}}, function(err, response){
        if (err) console.log(err);
      });
      res.render('playlist', { playlist:playlist });
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

      // TODO check if user has already voted on this
      // Check if it worked, if it did then send the incrementation back...
      // If it didn't (like if the user already voted) send back a 0
      res.status(200).send(JSON.stringify(req.body.inc));
    }
  });
});


router.post('/playlist/next', function(req, res){
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
      res.status(200).send(response[0].items.id);
    }
  });
});

module.exports = function(io){
  io.on('connection', function(socket) {
    console.log('socket connection');
  });
  return router;
}
