// NOTE: You must replace the client id on the following line.
var clientId = '190365650360-sd2n8va3jvh61m67vijv1d5d6s4c5dai.apps.googleusercontent.com';
var scopes = 'https://spreadsheets.google.com/feeds';

function init() {
    gapi.auth.authorize(
        { client_id: clientId, scope: scopes, immediate: true },
        handleAuthResult);
}

function handleAuthResult(authResult) {
    var authorizeButton = document.getElementById('authorize-button');
    if (authResult && !authResult.error) {
        authorizeButton.style.visibility = 'hidden';
        makeApiCall();
    } else {
        authorizeButton.style.visibility = '';
        authorizeButton.onclick = handleAuthClick;
    }
}

function handleAuthClick(event) {
    gapi.auth.authorize(
        { client_id: clientId, scope: scopes, immediate: false },
        handleAuthResult);
    return false;
}

function makeApiCall() {
    drawSheetName();
    function drawSheetName() {
        var queryString = encodeURIComponent('SELECT B,C LIMIT 5 OFFSET 8');

        var query = new google.visualization.Query(
            'https://docs.google.com/spreadsheets/d/1_SRg-YIXU39BQ-4ri1cVZ5F_c_qnXtmT1ZszHWu2Hk8/gviz/tq?sheet=Sheet1&headers=1&tq=' + queryString, { sendMethod: 'auto' });
        query.send(handleSampleDataQueryResponse);
    }

    function handleSampleDataQueryResponse(response) {
        if (response.isError()) {
            alert('Error in query: ' + response.getMessage() + ' ' + response.getDetailedMessage());
            return;
        }

        var data = response.getDataTable();
        var chart = new google.visualization.ColumnChart(document.getElementById('chart_div'));
        chart.draw(data, { height: 400 });
    }
}

function handleTqResponse(resp) {
    document.write(JSON.stringify(resp));
}