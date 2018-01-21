var SqueezeServer = require('squeezenode');
var sleep = require('sleep');
var squeeze = new SqueezeServer('http://localhost', 9000);
var request = require('request');
var readline = require('readline');
var express = require('express');
var bodyParser = require('body-parser');

var app = express();
var port = 8080;
app.use(bodyParser.json());


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

function getShow(artist, callback) {
  console.log("Getting show by " + artist);
  url = "https://archive.org/advancedsearch.php"
  query = "collection:" + artist + " AND mediatype:etree";
  filters = "fl[]=identifier&fl[]=venue&fl[]=date&fl[]=year&fl[]=title&fl[]=creator"
  sort = "sort[]=downloads desc"

  completeURL = url + "?q=" + query + "&" + filters + "&" + sort + "&rows=10&page=1&output=json";

  request(completeURL, { json: true }, (err, res, body) => {
    if (err) {return console.log(err); }
    randomNum = Math.floor(Math.random() * Math.floor(10));
     callback(body.response.docs[randomNum]);
  })
}

function getShowByYear(artist, year, callback) {
  console.log("Getting show by " + artist + " in " + year);
  url = "https://archive.org/advancedsearch.php"
  query = "collection:" + artist + " AND mediatype:etree AND year:" + year;
  filters = "fl[]=identifier&fl[]=venue&fl[]=date&fl[]=year&fl[]=title&fl[]=creator"
  sort = "sort[]=downloads desc"

  completeURL = url + "?q=" + query + "&" + filters + "&" + sort + "&rows=10&page=1&output=json";

  request(completeURL, { json: true }, (err, res, body) => {
    if (err) {return console.log(err); }
    var maxNum = 10;
    if (body.response.numFound < 10) {
      maxNum = body.response.numFound;
    }
    console.log("Max num is " + maxNum);

    if (maxNum === 0) {
      //No results found, exit
      return undefined;
    }
    randomNum = Math.floor(Math.random() * Math.floor(10));
     callback(body.response.docs[randomNum]);
  })
}

function getNewestShow(artist, callback) {
  console.log("Getting newest show by " + artist);
  url = "https://archive.org/advancedsearch.php"
  query = "collection:" + artist + " AND mediatype:etree";
  filters = "fl[]=identifier&fl[]=venue&fl[]=date&fl[]=year&fl[]=title&fl[]=creator"
  sort = "sort[]=date desc"

  completeURL = url + "?q=" + query + "&" + filters + "&" + sort + "&rows=1&page=1&output=json";

  request(completeURL, { json: true }, (err, res, body) => {
    if (err) {return console.log(err); }
     callback(body.response.docs[0]);
  })
}

app.post('/', function(req, res) {
  //Check which intent was triggered
  if(req.body.result.metadata.intentName === "Play Music") {
    //User is playing music, get artist and play
    console.log("Intent: Play Music");
    var artist = req.body.result.parameters.Artist;
    //Remove the spaces so it conforms with how Archive indexes it as a collection
    artist = artist.replace(/\s+/g, '');

    //Check if should grab the latest show
    var isNew = req.body.result.parameters.new;
    if (isNew.length != 0) {
      //Newest show requested
      getNewestShow(artist, function(doc) {
        //Log some info about the show
        console.log(doc.creator + " - " + doc.date + " " + doc.venue);
        setAlbum("https://archive.org/download/" + doc.identifier + "/" + doc.identifier + "_vbr.m3u");

      });
      res.send('RESPONSE');
      return;
    } 

    var year = req.body.result.parameters.year;
    if (year.length != 0) {
      getShowByYear(artist, year, function(doc) {
        //If there isn't a result found, exit
        if (typeof doc == 'undefined') {
          res.send("FAILED");
          return;
        }

        console.log(doc.creator + " - " + doc.date + " " + doc.venue);
        setAlbum("https://archive.org/download/" + doc.identifier + "/" + doc.identifier + "_vbr.m3u");

      });
      res.send('RESPONSE');
      return;
    }

    //Grab a show
    getShow(artist, function(doc) {
      console.log(doc.creator + " - " + doc.date + " " + doc.venue);
      setAlbum("https://archive.org/download/" + doc.identifier + "/" + doc.identifier + "_vbr.m3u");
    });
  }
  res.send('RESPONSE');
});


squeeze.on('register', function() {

  //  const rl = readline.createInterface({
  //    input: process.stdin,
  //    output: process.stdout
  //  });
  //
  //  rl.question("Type an Artist: ", (artist) => {
  //    getShows(artist, function(docs) {
  //      console.log(docs[0].identifier);
  //      setAlbum("https://archive.org/download/" + docs[0].identifier + "/" + docs[0].identifier + "_vbr.m3u");
  //      rl.close();
  //    });
  //  });
  //


  app.listen(port);
  console.log('API Started on port ' + port);
});

