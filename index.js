var SqueezeServer = require('squeezenode');
var sleep = require('sleep');
var squeeze = new SqueezeServer('http://localhost', 9000);
var request = require('request');
var readline = require('readline');

function playerIdByName(name, callback) {
  var found = false;
  squeeze.getPlayers( function(reply) {
    for (var id in reply.result) {
      if(reply.result[id].name === name) {
        found = true;
        callback ({ok: true, playerId: reply.result[id].playerid});
      }
    }

    if (!found)
      callback ({ok: false});
  });
}

function setAlbum(url) {
  squeeze.getPlayers( function(reply) {
    if (reply.ok)
      playerIdByName("SqueezeLite", function(pl) {
        if (!pl.ok)
          console.log('Error occused! Specified player does not exist');
        else {
          squeeze.players[pl.playerId].getPlaylist(0, 100, function(reply) {
            if (!reply.ok)
              console.log ('Error occured!');
            else {
              console.dir(reply.result);
            }
          });

          sleep.sleep(1);

          squeeze.players[pl.playerId].clearPlayList(function(reply) {
            if (!reply.ok)
              console.log ('Error occured!');
            else {
              console.dir(reply.result);
            }
          });

          sleep.sleep(1);

          squeeze.players[pl.playerId].addToPlaylist(url, function(reply) {
            if (!reply.ok)
              console.log ('Error occured!');
            else {
              console.dir(reply.result);
            }
          });

          sleep.sleep(1);

          squeeze.players[pl.playerId].play(function(reply) {
            if (!reply.ok)
              console.log ('Error occured!');
            else {
              console.dir(reply.result);
            }
          });
        }
    });
  });

}

function getShows(artist, callback) {
  url = "https://archive.org/advancedsearch.php"
  query = "collection:" + artist + " AND mediatype:etree";
  filters = "fl[]=identifier&fl[]=venue&fl[]=date"

  completeURL = url + "?q=" + query + "&" + filters + "&rows=10&page=1&output=json";

  request(completeURL, { json: true }, (err, res, body) => {
    if (err) {return console.log(err); }
     callback(body.response.docs);
  })


}


squeeze.on('register', function() {
  //  setAlbum("https://archive.org/download/vulfpeck2016-09-08.cmc621xt.sbd.matrix.flac24/vulfpeck2016-09-08.cmc621xt.sbd.matrix.flac24_vbr.m3u");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question("Type an Artist: ", (artist) => {
    getShows(artist, function(docs) {
      console.log(docs[0].identifier);
      setAlbum("https://archive.org/download/" + docs[0].identifier + "/" + docs[0].identifier + "_vbr.m3u");
      rl.close();
    });
  });

});

