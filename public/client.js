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
    url:'/v1/subscribe',
    success: nowplaying,
    dataType: 'json',
    complete: poll
  })
}

$(function() {
  console.log('hello world :o');
  
  $.get('/v1/nowplaying', nowplaying);
  
  poll()

  $('form').submit(function(event) {
    event.preventDefault();
    var url = $('input').val();
    $.post('/v1/play');
  });

});
