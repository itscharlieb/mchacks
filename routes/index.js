// TODO Pertinent
//    Should create users
//    Then fix the voting issues
//    Fix the scrollable bars, they look kindof bad in my UI
//    Put playlist in a session?


// TODO Later: Adding configuration options to a playlist
// Playing mode
//    Synced: All the clients are synced to the masters flow 
//        All of the clients play the video
//        This might be difficult and not worth pursuing
//        Would be good for things like silent discos
//          or if you are listening to an audiobook with someone
//          or if you are studying with someone
//    Live: In this we don't really need the player
//        Just the queue, a searchbar, and a now playing
//        Might be useful to have a semi-livestream to see where the video is
//          This isn't really necessary 
//          Might be worth adding if we figure out livestream
//    Passive: Like a songza, 8tracks or other type of video playlist app
//        The videos play from the beginning of the playlist
//        What we have now
//        
// Play collaboration mode
//    Full collaboration: All parties can pause or change video time
//    Master-slave: Only the master can pause or change the video time
//    No collaboration: The parties are independent in their playing
//        What we have now
//
// Playlist collaboration options
// Consider having "groups" with different privaledges
//    Full collaboration: All parties can add/remove songs and cast votes
//    No removal: Full collab but without the ability to remove
//        What we have now
//    Voting only: Only allow users to vote on the songs
//    No collaboration: Can only access the playlist
//
// Playlist Visibility
//    Public: Everyone can easily find and use (published)
//        What we have now
//    Hidden: Anyone with the link can access 
//    Private: Need a key to access
//    Members only: Only users can access
//        Naturally, only members can vote (I believe)
//        Could also constrain to only members being allowed to suggest
//        Goes along with the notion of "groups"
//
// Video termination options (don't really know what to call this)
//    Delete: When the video is watched it is "removed" from the playlist
//        Use case: say I have a set of videos that I want to watch, 
//          but haven't gotten around to watching yet.
//          You could make a playlist that removes the videos when they have been watched
//        Use case 2: Music blogs
//          Typically I go on websites like freshnewtracks or thissongissick
//          to get new music. We could use this as a similar avenue to find new songs.
//          Say a user would like to find new music. They could visit a playlist
//          by one of these blogs or similar blogger type people. 
//          The only songs on the playlist will be those that are "new" to me.
//          Could pay people to make good playlists based on a portion of our ad revenue.
//            Pay is comeasurate with the number of views on the playlist
//            This will be incentive to create good playlists...
//        Use case 3: Could also be used to keep playlists smaller
//        Would have to distinguish between the behaviours on active vs passive playlists
//          Passive falls in line with the first two use cases
//            We only want to delete the song if a specific user has viewed it
//          Active would be for the last use case
//            Deletes if the master has finished the video
//    Reset votes: When the video is watched the votes are reset to 0
//        What we have now
//    Active deletion: Delete if the user downvotes
//        This might be a better alternative for the "music blog" idea
//        Keep songs on the playlist that I like
//
// Vote threshold: if a video goes below a certain number of downvotes, will be deleted
//
// Sorting Mode
//    Sort by ratings
//        What we have now
//    Sort by time added
//        Works as a classic queue instead of a priority queue
//


// TODO possible DB change
// Could change the DB to have a videos collection instead of having it embedded
// This would allow us to have global ratings object (and other attrs) for a given video
// The items subdocument would still exist in the playlist
//    This would be like a "votes" for the specific playlist
//    And a foreign key to the video in the videos collection
// If we do change to this, we should use SQL
//    The highly relational nature of this system lends itself well to relational DBs

// TODO constructing your own playlist
// Consider having the option to "add to playlist" for videos in other playlists
//


// I see the initial page as a sort of scrolling implementation you see on modern websites
// Each "pane" will be a description of the different playlist types
//    and several example playlists


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


var MongoStore = require('connect-mongo')(express);
app.use(cookieParser());
app.use(expressSession({
  store: new MongoStore({
    mongooseConnection: conn
  }),
  secret:'seacrets<3wisburrs'
}));



// TODO perhaps change to playlist_name, song_name, and song_id
//    This is rather confusing
// Consider putting in a "last_played"
var PlaylistSchema = new Schema({
    name: String,
    img: String,                                    // The image for the playlist
    // creator: mongoose.Schema.Types.ObjectId,     // Not needed for now
    items: [{
      id: String,                                   // Unique id in system used
      url: String,                                  // URL of the item... not really needed with id
      name: String,
      artist: String,
      votes: Number,
    }]
});

var UserSchema = new Schema({
    userName: String,
    password: String,
    email: String,
});

var Playlist = mongoose.model('playlist', PlaylistSchema);
var Users = mongoose.model('users', UserSchema);


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
      res.render('index', { title: 'Index', playlists: response, 
        script: '/javascripts/index.js' });
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
      res.render('playlist', {script: '/javascripts/playlist.js'});
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
      
        res.render('playlist', { playlist:response, script: '/javascripts/playlist.js' });
      }

      // If no songs were found in the playlist then render with empty object
      res.render('playlist', { script: '/javascripts/playlist.js' });
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
     
      Playlist.count({"_id": playlist_id, "items.id": data.yid}, function(err, count){
        if (err){
          console.log(err);
        }
        else{
          if (count > 0){
            console.log("Item " + data.yid + "already exists in the db: ");
            router.io.sockets.in(playlist_id).emit('existent_song', data);
          }
          else{
            Playlist.findByIdAndUpdate(mongoose.Types.ObjectId(playlist_id),
                                        {"$addToSet": {'items':
                                                        {'id': data.yid,
                                                         'name': data.name,
                                                         'votes': 0}}
                                        }, function(err2,response){
              if (err2){
                console.log(err2);
              }
              else{
                console.log("New item " + data.yid + " added to database");
                router.io.sockets.in(playlist_id).emit('new_song', data);
              }
            });

          }
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




