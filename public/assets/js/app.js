$("#scrape").on("click", function() {
  event.preventDefault();

  $.get("/scrape").then(function(data) {
    window.location.replace(data);
  });