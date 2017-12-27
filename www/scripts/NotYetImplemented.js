//function loadOAuth2Teste() {
//    // Create login object and initialize it with your app client id and secret
//    gl = new GoogleLogin(CLIENT_ID, CLIENT_SECRET);
//    gl.isLoggedIn(updateSigninStatus);
//}

///**
//    *  Called when the signed in status changes, to update the UI
//    *  appropriately. After a sign-in, the API is called.
//    */
//function updateSigninStatus(isSignedIn) {
//    if (isSignedIn != -1) {
//        $("#oAuthBtn").text("Already Requested. Click to logout");
//        $("#oAuthBtn").data("logged", true);
//        $("#getDataSheetInfo").show();
//        //logged in
//    } else {
//        $("#oAuthBtn").text("Request OAuth2");
//        $("#oAuthBtn").data("logged", false);
//        $("#getDataSheetInfo").hide();
//        //logged out
//    }
//}
//function handleAuthClick(e) {
//    var logged = $(e).data("logged");
//    if (logged) {
//        handleSignoutClick();
//        updateSigninStatus(-1);
//    }
//    else {
//        handleSigninClick();
//        updateSigninStatus(1);
//    }
//    /**
//     *  Sign in the user upon button click.
//     */
//    function handleSigninClick(event) {
//        gl.startSignin(updateSigninStatus);
//    }

//    /**
//     *  Sign out the user upon button click.
//     */
//    function handleSignoutClick(event) {
//        gl.logOut();
//    }
//}







// 3. This function creates an <iframe> (and YouTube player)
//    after the API code downloads.
var player;
function onYouTubeIframeAPIReady(id,videoId) {
    player = new YT.Player(id, {
        height: "270px",
        width: "480px",
        videoId: videoId,
        //events: {
        //    'onReady': onPlayerReady,
        //    'onStateChange': onPlayerStateChange
        //}
    });
}