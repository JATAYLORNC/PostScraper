var express = require("express");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");

// Require scraping tools
var request = require("request");
var cheerio = require("cheerio");

// Initialize Express
var app = express();
var port = process.env.PORT || 3000;
var exphbs = require("express-handlebars");

// Configure middleware

// Use body-parser for handling form submissions
app.use(bodyParser.urlencoded({ extended: true }));
// Use express.static to serve the public folder as a static directory
app.use(express.static("public"));

// Require all models
var db = require("./models");

// Connect to the Mongo DB
mongoose.connect("mongodb://localhost/washPostScrape");

// Routes

app.get("/", function(req, res) {
  //define object to render to view handlebars
  var hdbs = {
    title: "Uh Oh!  Looks like we don't have any new articles!"
  };

  //render the object to index.handlebars
  res.render("index", hdbsObject);

});

// A GET route for scraping the Washington Post website
app.get("/scrape", function(req, res) {
  // First, we grab the body of the html with request
  request("http://www.washingtonpost.com", function(error, response, html) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(html);

    var hdbsObject = {};
    var results = []

    // Select each element in the HTML body from which you want information.
    // NOTE: Cheerio selectors function similarly to jQuery's selectors,
    // but be sure to visit the package's npm page to see how it works
    $("div.headline").each(function(i, element) {

      var title = $(element).find('a').text();
      var link = $(element).children().attr("href");

      if(link && title) {
         // Save these results in an object that we'll push into the results array we defined earlier
        results.push({
          title: title,
          link: link
        });
      }
    });
    var hdbsObject = 
    {
      articles: results
    }

    //render the object to index.handlebars
    res.render("index", hdbsObject);
  });
});

// // Route for getting all Articles from the db
// app.get("/articles", function(req, res) {
//   // TODO: Finish the route so it grabs all of the articles
//   db.Article.find({}).then(function(dbArticles) {
//     // If all Users are successfully found, send them back to the client
//     res.json(dbArticles);
//   })
//   .catch(function(err) {
//     // If an error occurs, send the error back to the client
//     res.json(err);
//   });
// });

// // Route for grabbing a specific Article by id, populate it with it's note
// app.get("/articles/:id", function(req, res) {
//   // TODO
//   // ====
//   // Finish the route so it finds one article using the req.params.id,
//   // and run the populate method with "note",
//   // then responds with the article with the note included
//   db.Article.findOne({"_id": req.params.id})
//     .populate("note")
//     .then(function(Article) {
//       // If all Users are successfully found, send them back to the client
//       res.json(Article);
//     })
//     .catch(function(err) {
//       // If an error occurs, send the error back to the client
//       res.json(err);
//     });
// });

// // Route for saving/updating an Article's associated Note
// app.post("/articles/:id", function(req, res) {
//   // TODO
//   // ====
//   // save the new note that gets posted to the Notes collection
//   // then find an article from the req.params.id
//   // and update it's "note" property with the _id of the new note
//   db.Note.create(req.body)
//     .then(function(dbNote) {
//       // If a Note was created successfully, find one Article (there's only one) and push the new Note's _id to the articles's `notes` array
//       // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
//       // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
//       return db.Article.findOneAndUpdate({"_id": req.params.id}, { $set: { note: dbNote._id } }, { new: true });
//     })
//     .then(function(dbUser) {
//       // If the User was updated successfully, send it back to the client
//       res.json(dbUser);
//     })
//     .catch(function(err) {
//       // If an error occurs, send it back to the client
//       res.json(err);
//   });

// });

// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});