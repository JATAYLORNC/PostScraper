$("document").ready(function() {
  
  //listen for click event on save article button
  $("a.saveArticle").on("click", function(event) {
    event.preventDefault();

    //capture title and link to article
    var title = $(this).data("title");
    var link = $(this).data("link");
    var summary = $(this).data("summary");

    //save article title and link in JSON object
    var saveArticle = {
      title: title, 
      link: link,
      summary: summary
    };

    //run post route to save article to mongoDB Note collection
    $.post("/article", saveArticle).then(function(data) {
      //reload scrape route
      window.location.replace("/scrape");
    });
  });

  //listen for click event on button for viewing article notes
  $("a.articleNote").on("click", function(event) {
    event.preventDefault();

    //capture article id
    var articleId = $(this).data("id");

    //add article id as a data attribute to the save note button
    $("#saveNote").attr("data-id", articleId);

    //add article ID to the Note Modal header
    $("#noteHeader").text("Notes for article:" + articleId);

    // Now make an ajax call for the article notes
    $.ajax({
      method: "GET",
      url: "/notes/" + articleId
    })
    // With that done, add the note information to the page
    .then(function(data) {

      //check if there are any notes
      if(!data.note[0]) {

        //append no notes statement to Note modal
        $("#noteDiv").append("<p>No notes for this article yet.</p>");
        
      } else {

        //loop through array of note objects
        for(var i=0; i<data.note.length; i++) {
          
          //append notes to note div in Note modal body
          $("#noteDiv").append("<p>" + data.note[i].body +  
          "<a href='' class='btn btn-sm btn-danger float-right mr-3 deleteNote' data-id=" + 
          data.note[i]._id + "><span>&times;</span></a></p>");
        }
      }

      //toggle note modal to visible
      $('#noteModal').modal({show:true});
    });
  });


  //listen for note modal to be hidden
  $("#noteModal").on("hidden.bs.modal", function () {
    //empty notes from modal when it is closed so that they are not there when viewing notes
    //for another article
    $("#noteDiv").empty();
});

  //listen for click event on save note button in note modal
  $(document).on("click", "#saveNote", function(event) {
    event.preventDefault();

    //capture the article id associated with the note
    var articleId = $("#saveNote").attr("data-id");

    // Run a POST request to add the new note to the Note collection
    $.ajax({
      method: "POST",
      url: "/articles/" + articleId,
      data: {

        // Value taken from note textarea
        body: $("#articleNote").val()
      }
    })
    // With that done
    .then(function(data) {

      //hide the note modal
      $('#noteModal').modal('hide');
    });

    // remove the values entered in the textarea for the note modal
    $("#articleNote").val("");

  });

  //listen for click event on delete saved article button
  $("a.deleteSaved").on("click", function(event) {
    event.preventDefault;

    //capture id of article to be deleted from saved
    var articleId = $(this).data("id");

    //var to hold JSON object for article ID
    var article = {
      _id: articleId
    };

    //run a delete request to delete the article from the Article collection
    $.ajax({
      url: '/deleteArticle',
      type: 'DELETE',
      success: function(result) {
        //reload saved articles route
        window.location.replace("/savedarticles");
      }
    });
  });

  //listen for click event on delete note button in note modal
  $(document).on("click", "a.deleteNote", function(event) {
    event.preventDefault;

    //capture note id
    var noteId = $(this).attr("data-id");

    //run a delete route to delete the note from the Note collection
    $.ajax({
      url: '/deleteNote',
      type: 'DELETE',
      data: {

        // Value taken from note textarea
        _id: noteId
      },
      success: function(result) {

      //hide the note modal
      $('#noteModal').modal('hide');
        //reload saved articles route
        window.location.replace("/savedarticles");
      }
    });
  });

  //check if the current path is the scrape route
  if(window.location.pathname == "/scrape") {
    //only display the scrape modal with the number of articles scraped
    //if the current path is the scrape route.
    $('#scrapeModal').modal();
  }

});

