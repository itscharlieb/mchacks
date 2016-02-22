// TODO
//    The main thing to do now is to find a way to sync the times across users
//    Should create users after that
//    Then fix the voting issues

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

// Temporary database seeder
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
  // Find all the playlists
  //    Exclude the songs from the returned object because they aren't used on main page
  //    They will only slow down the load times
  Playlist.find({}, {items: 0}, function(err,response){
    if (err){
      console.log(err);
      res.status(500).send(err);
    }
    else{
      res.render('index', { title: 'Index', playlists: response });
    }
  });
});

// This probably does not need sockets, but do we want them?
router.post('/playlist/create', function(req, res){
  new Playlist({'name': req.body.playlist_name}).save(function(err, response){
    if (err){
      console.log(err)
      res.status(500).send(err);
    }
    else{

      // Set the playlist id, since it has changed
      playlist_id = response._id;
      res.render('playlist', { });
    }
  });
});

// playlist id is only going to be updated here
// It is good to keep it on hand so it doesn't need to be passed around
var playlist_id = null;
router.get('/playlist/:id', function(req, res, next) {
  // Set the new playlist id
  playlist_id = req.params.id;


  // Aggregate over the items with the playlist id, sort them in descending order
  Playlist.aggregate([{'$match': {'_id': mongoose.Types.ObjectId(playlist_id)}},
                      {'$unwind': '$items'}, {'$sort': {'items.votes': -1}},
                    ]).exec(function(err, response){
    if (err){
      console.log(err);
      res.status(500).send(err);
    }
    else{
      // If the playlist contains songs
      if (response.length != 0){
        // Set the first song to 0 votes (it will be played, so reset)
        var song_id = response[0].items.id;
        Playlist.findOneAndUpdate({"items.id": song_id}, {"$set": {"items.$.votes":0}}, function(err, response){
          if (err) console.log(err);
        });
      
        res.render('playlist', { playlist:response });
      }

      // If no songs were found in the playlist then render with empty object
      res.render('playlist', { });
    }
  });
});











// -------------------- SOCKETS -------------------- \\
module.exports = function(io){
  router.io = io;

  router.io.on('connection', function(socket) {
    socket.join(playlist_id);
    console.log('socket connection');

    // TODO On init logic
    // Need a way of getting timestamp logic



    // TODO Should probably compress like and dislike into one data object
    socket.on('like', function(data){
      console.log("like emitted");
      Playlist.findOneAndUpdate({"_id": playlist_id, "items.id": data}, 
                                {"$inc": {"items.$.votes":1}}, function(err, response){
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
      Playlist.findOneAndUpdate({"_id": playlist_id, "items.id": data}, 
                                {"$inc": {"items.$.votes":-1}}, function(err, response){
        if (err){
          console.log(err);
          res.status(500).send(err);
        }
        else{
          // TODO want to pass back the database value 
          //  (decremented because the database response is not updated)
          //  To maintain fidelity to the DB
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
          var song_id = response[0].items.id;
          Playlist.findOneAndUpdate({"items.id": song_id}, {"$set": {"items.$.votes":0}}, function(err, response){
            if (err) console.log(err);
          });
          router.io.sockets.in(playlist_id).emit('next_song', response[0].items.id);
        }
      });
    });
    socket.on('new_song', function(data){
      // data has fields of name and yid 
      // This is invoked when a search element is clicked
      // TODO add checks to ensure that the youtube ids are unique
     
      Playlist.findByIdAndUpdate(mongoose.Types.ObjectId(playlist_id),
                                  {"$addToSet": {'items':
                                                  {'id': data.yid,
                                                   'name': data.name,
                                                   'votes': 0}}
                                  }, function(err,response){

        if (err){
          console.log(err);
        }
        else{
          router.io.sockets.in(playlist_id).emit('new_song', data);
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




