// client-side js
// run by the browser each time your view template is loaded

// by default, you've got jQuery,
// add other scripts at the bottom of index.html

function nowplaying(info) {
  $('#nowplaying').empty()
  Object.keys(info).map(key => {
    $(`<dt>${key}</dt><dd>${info[key]}</dd>`).appendTo('#nowplaying')
  })
}

function poll(xhr, status) {
  if(status == "error") {
    setTimeout(poll, 1000)
    return
  }

  $.ajax({
    url:'/subscribe',
    success: nowplaying,
    dataType: 'json',
    complete: poll
  })
}

$(function() {
  console.log('hello world :o');
  
  $.get('/nowplaying', nowplaying);
  
  poll()

  $('form').submit(function(event) {
    event.preventDefault();
    var dream = $('input').val();
    $.post('/dreams?' + $.param({dream: dream}), function() {
      $('<li></li>').text(dream).appendTo('ul#dreams');
      $('input').val('');
      $('input').focus();
    });
  });

});
