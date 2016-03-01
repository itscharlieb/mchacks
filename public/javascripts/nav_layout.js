$(document).ready(function(){
  $('.modal-content').on('keyup', 'input', function(){
    var parentDiv = $(this).parent().parent().parent();
      
    if (parentDiv.hasClass('createUser')){
      var pass = $('#password');
      var passCheck = $('#validate');
      var userName = $('#userName');
      if (pass.val() == passCheck.val() 
          && pass.val().length >= 5 && passCheck.val().length >= 5
          && userName.val().length >= 5){
            console.log("ok");
        passCheck.addClass('valid');
        pass.addClass('valid');
        userName.addClass('valid');
        $('#createUserBtn').prop('disabled', false);
      }
      else{
        passCheck.removeClass('valid');
        pass.removeClass('valid');
        userName.removeClass('valid');
        $('#createUserBtn').prop('disabled', true);
      }
    }
//    else if (parentDiv.hasClass('login')){
//      Don't really care to much to pre-process this      
//    }

    if ($(this).val().length < 5 && $(this).val().length != 0){
      $(this).addClass('invalid');
      if (parentDiv.hasClass('createPlaylist')){
        $('#createPlaylistBtn').prop('disabled',true);
      }
    }
    else{
      $(this).removeClass('invalid');
      if (parentDiv.hasClass('createPlaylist')){
        $('#createPlaylistBtn').prop('disabled',false);
      }
    }

  });
});
