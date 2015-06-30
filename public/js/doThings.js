'use strict';

$(document).ready(function() {

    var recos = $("#recommendations");
    recos.hide();
  var widgetWidth = 700, widgetHeight = 700, // Default width and height
    personImageUrl = 'images/app.png'; // Can be blank

  // Jquery variables
  var $content = $('.content'),
    $loading = $('.loading'),
    $error = $('.error'),
    $errorMsg = $('.errorMsg');

  /**
   * Clear the "textArea"
   */
  $('.clear-btn').click(function(){
    $('.clear-btn').blur();
    $content.val('');
    updateWordsCount();
  });

  /**
   * Update words count on change
   */
  $content.change(updateWordsCount);

  /**
   * Update words count on copy/past
   */
  $content.bind('paste', function(e) {
    setTimeout(updateWordsCount, 100);
  });

  /**
   * 1. Create the request
   * 2. Call the API
   * 3. Call the methods to display the results
   */
  $('.analysis-btn').click(function(){
    $('.analysis-btn').blur();
    $loading.show();
    $error.hide();
    var events = $("#events");
    events.empty();

      $.ajax({
      type: 'POST',
      data: {
        text: $content.val()
      },
      url: '/',
      dataType: 'json',
      success: function(response) {
        $loading.hide();

        if (response.error) {
          showError(response.error);
        } else {
            //Code to show meetup events here
            recos.show();
            for(var i = 0; i < response.length; i++) {
                var eventTemplate = $($("#eventTemplate").html());
                //eventTemplate.attr("href",response[i]["event_url"]);
                eventTemplate.find("#groupName").text(response[i]["group"]["name"]);
                eventTemplate.find("#eventTitle").text(response[i]["name"]);
                var eventTime = response[i]["time"];
                eventTime = moment.utc(eventTime).local();
                eventTemplate.find("#eventTime").text(eventTime);
                var hlink = $("<a>");
                hlink.attr("href",response[i]["event_url"]);
                hlink.append(eventTemplate);
                events.append(hlink);
            }
        }

      },
      error: function(xhr) {
        $loading.hide();
        var error;
        try {
          error = JSON.parse(xhr.responseText);
        } catch(e) {}
        showError(error.error || error);
      }
    });
  });


  /**
   * Display an error or a default message
   * @param  {String} error The error
   */
  function showError(error) {
    var defaultErrorMsg = 'Error processing the request, please try again later.';
    $error.show();
    $errorMsg.text(error || defaultErrorMsg);
  }

  function updateWordsCount() {
    var text = $content.val();
    var wordsCount = text.match(/\S+/g) ? text.match(/\S+/g).length : 0;
    $('.wordsCount').css('color',wordsCount < 100 ? 'red' : 'gray');
    $('.wordsCount').text(wordsCount + ' words');
      if(wordsCount < 100) {
          $('.analysis-btn').prop("disabled",true);
      }
      else
          $('.analysis-btn').prop("disabled",false);
  }

  $content.keyup(updateWordsCount);
  updateWordsCount();
});
