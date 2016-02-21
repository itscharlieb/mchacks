var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');



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
        id: 'SKLcIxPHWA',
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
        id: 'GZSxOEqgm0c',
        url: 'https://www.youtube.com/watch?v=GZSsOEqgm0c',
        name: 'Major Lazer - Be Together feat. Wild Belle (Official Music Video)',
        artist: 'majorlazer',
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
      console.log(JSON.stringify(playlists));
      res.render('index', { title: 'Index', playlists: playlists });
    }
  });
});


router.get('/playlist/:id', function(req, res, next) {
  var playlistId = req.params.id;

  Playlist.findById(playlistId, function(err,playlist){
    if (err){
      console.log(err);
      res.status(500).send(err);
    }
    else{
      res.render('playlist', { playlist:playlist });
    }
  });
});

module.exports = router;
