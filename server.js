var express = require("express");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");

// Require scraping tools
var request = require("request");
var cheerio = require("cheerio");

// Initialize Express
var app = express();
var PORT = process.env.PORT || 3000;
var exphbs = require("express-handlebars");

// Configure middleware

// Use body-parser for handling form submissions
app.use(bodyParser.urlencoded({ extended: true }));
// Use express.static to serve the public folder as a static directory
app.use(express.static("public"));

// Require all models
var db = require("./models");

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/washPostScrape";

// Connect to the Mongo DB
mongoose.connect(MONGODB_URI);

//define engine for handlebars
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// Routes

//define root route
app.get("/", function(req, res) {

  //define object to render to view handlebars
  var hdbsObject = {
    messages: {0: {message: "Uh Oh!  Looks like we don't have any new articles!"}}
  };

  //render the object to index.handlebars
  res.render("index", hdbsObject);

});

// A GET route for scraping the Washington Post website
app.get("/scrape", function(req, res) {

  //grab the body of the Washington Post html with request
  request("http://www.washingtonpost.com", function(error, response, html) {

    //load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(html);

    //define variables to hold scrape results
    var hdbsObject = {};
    var results = {};
    var count = 0;

    // Select each element in the HTML body which contains the article headline and link.
    $("div.headline").each(function(i, element) {

      //capture the article title and link
      var title = $(element).find('a').text();
      var link = $(element).children().attr("href");
      var summary = $(element).parent().find('.blurb').text();

      //check if there is and article and link
      if(link && title) {
         // Save these results in an object that will be loaded into the results object defined earlier
        results[i] = {
          title: title,
          link: link,
          summary: summary
        };

        //increase the article count
        count +=1;
      }
    });

    //define handlebars object
    var hdbsObject = 
    {
      articles: results,
      count: count

    }
    
    //render the object to index.handlebars
    res.render("index", hdbsObject);
  });
});

//A POST route for saving (i.e. adding) articles to the Article collection in mongoDB
app.post("/article", function(req, res) {

  //variable to capture titles previously saved
  var titles = [];

  // route to grab all of the saved articles
  db.Article.find({}).then(function(dbArticles) {

    //loop throughs saved articles
    for(var i=0; i<dbArticles.length; i++) {

      //push previously saved article titles to array
      titles.push(dbArticles[i].title);
    }

      //check if title from request to save article is included in 
      //array of previously saved titles
      if (titles.includes(req.body.title)) {

        //return response to front end indicating title was previously saved
        var duplicate = {
          title: "Article Previously Saved"
        }

        res.json(duplicate);
    
      } else {
    
        //create new document in Article collection
        db.Article.create(req.body).then(function(dbArticle) {
    
          //return article object to front end
          res.json(dbArticle);
    
        }).catch(function(err) {
                // If an error occurs, send the error back to the client
                res.json(err);
              });
      }
  });

});

// Route for getting all saved Articles from the db
app.get("/savedarticles", function(req, res) {

  // route to grab all of the saved articles
  db.Article.find({}).then(function(dbArticles) {
   
    //define handlebars object
    var hdbsObject = {
      savedArticles: dbArticles
    }

    //render all saved articles to handlebars
    res.render("index", hdbsObject);
  })
  .catch(function(err) {
    // If an error occurs, send the error back to the client
    res.json(err);
  });
});

//A DELETE route for removing a specific article document from the Article collection
app.delete("/deleteArticle", function(req, res) {

  //capture delete article ID object in a variable
  var id = req.body;

  //route to delete a specific article
  db.Article.deleteOne(id).then(function(deleteID) {

    //return deleted article ID object to the front end
    res.json(deleteID);
  })
  .catch(function(err) {
    // If an error occurs, send the error back to the client
    res.json(err);
  });
});

//A DELETE route for removing a specific note document from the Note collection
app.delete("/deleteNote", function(req, res) {

  //capture the delete note ID object in a variable
  var id = req.body;

  //route to delete a specific article
  db.Note.deleteOne(id).then(function(deleteID) {
    //return deleted note ID object to the front end
    res.json(deleteID);
  })
  .catch(function(err) {
    // If an error occurs, send the error back to the client
    res.json(err);
  });
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function(req, res) {
  // Create a new note and pass the req.body to the entry
  db.Note.create(req.body)
    .then(function(dbNote) {

      // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
      // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
      // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
      return db.Article.findOneAndUpdate({ _id: req.params.id }, { $addToSet: { note: dbNote._id }}, { new: true });
    })
    .then(function(dbArticle) {
      // If we were able to successfully update an Article, send it back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for grabbing a specific Article by article id, populate the notes
app.get("/notes/:id", function(req, res) {

  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  db.Article.findOne({ _id: req.params.id })
    // ..and populate all of the notes associated with it
    .populate("note")
    .then(function(dbArticle) {
      // If we were able to successfully find an Article with the given id, send it back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});