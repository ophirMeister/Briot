/**
 * Script for logging into the technician area.
 * Sends a request to the server to check the user name and password.
 * If receives a success response, it redirects the user to the technician area.
 */
$('#myFormSubmit').click(function(e){
    e.preventDefault();
    var name = $('#userid').val();
    var pass = $('#passwordinput').val();
    $.ajax({
        type: 'POST',
        data: JSON.stringify({
            name : name,
            pass : pass
        }),
        contentType: 'application/json',
        url: "./login",
        success: function(data,textStatus,jqXHR ){
            // Notice that the script redirects the user to a new location, with his name and "data" parameter.
            // The data parameter is a temporary key which is created for this current login, and is checked prior
            // to redirecting him to the technician area.
            window.location = "/log/"+data+"/"+name;
        },
        error: function( xhr, textStatus, errorThrown ){
            alert(xhr.responseText);
        }
    });
});
