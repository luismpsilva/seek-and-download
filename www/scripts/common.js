//Global Scope declaration
var CLIENT_ID = '190365650360-sd2n8va3jvh61m67vijv1d5d6s4c5dai.apps.googleusercontent.com', CLIENT_SECRET = 'tI6xn_JEjVm23hs_1gK5Dbnm',
// Array of API discovery doc URLs for APIs used by the quickstart
DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4", "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
SCOPES = "https://www.googleapis.com/auth/spreadsheets.readonly https://www.googleapis.com/auth/drive.metadata.readonly" +
    " https://www.googleapis.com/auth/youtube https://spreadsheets.google.com/feeds https://www.googleapis.com/auth/userinfo.email",
GoogleAuth,
app, obs_Master, obs_DataSheetOptions;

// This code loads the IFrame Player API code asynchronously.
//var tag = document.createElement('script');

//tag.src = "https://www.youtube.com/iframe_api";
//var firstScriptTag = document.getElementsByTagName('script')[0];
//firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

var delay = (function () {
    var timer = 0;
    return function (callback, ms) {
        clearTimeout(timer);
        timer = setTimeout(callback, ms);
    };
})();

function BigLoading() {
    $('body').toggleClass('loaded');
}

function hideLoader() {
    $("#spinner").parent().addClass("hidden");
    $("#spinner").removeClass("is-active");
}
function showLoader() {
    $("#spinner").parent().removeClass("hidden");
    $("#spinner").addClass("is-active");
}

function showNotification(oType, message, infoType) {
    var notification = document.querySelector("#toast-message");
    $(notification).remove("mdl-snackbar--active");
    $(notification).removeClass("toast-success toast-warning toast-info toast-error");
    $(notification).addClass("toast-" + infoType);
    switch (oType) {
        case 'snackbar':
            var data = {
                message: message,
                actionHandler: function (event) { },
                actionText: 'Undo',
                timeout: 10000
            };
            notification.MaterialSnackbar.showSnackbar(data);
            //do something
            break;
        case 'toast':
            var data = { message: message, timeout: 5000 };
            notification.MaterialSnackbar.showSnackbar(data);
            break;
    }
    if (infoType == 'error')
        console.log("Error: " + message);
}

function closeModalView(args, viewname) {
    if (args) {
        if (args.button) {
            var data = args.button.data();
            viewname = data.viewname;
        }
        else {
            if (args.sender && args.sender.element) {
                var data = args.sender.element.data();
                viewname = data.viewname;
            }
            else {
                if (args.currentTarget) {
                    var data = $(args.currentTarget).data();
                    viewname = data.viewname;
                }
            }
        }
    }
    if (viewname && viewname !== '' && viewname.indexOf('#') < 0) {
        viewname = '#' + viewname;
    }

    if (viewname && $(viewname).length > 0) {
        if ($(viewname).data('kendoMobileModalView')) {
            $(viewname).data('kendoMobileModalView').close();
        }

        if ($(viewname).data('modalview')) {
            var modalview = $('#' + $(viewname).data('modalview'));
            if (modalview.data('kendoMobileModalView')) {// initialized
                modalview.kendoMobileModalView("open");
            }
        }
    }
}

function navigate(e, from, to, animated) {
    if (!e) {
        if (!animated){
            $(from).toggleClass("hidden");
            $(to).toggleClass("hidden");
        } else {
            $(from).hide("slide", null, 300, function () {
                $(to).show("slide", null, 500);
            });
        }
        $("#layout-back-btn").attr("data-backto", from);
        $("#layout-back-btn").attr("data-from", to);
    } else {
        showLoader();
        var from = $(e).data("from");
        var to = $(e).data("backto");
        var fn_close = $(from).data("onclose");
        if (fn_close && typeof window[fn_close] == 'function')//dirty but for now works fine
            window[fn_close]();

        $(from).hide("slide", null, 300, function () {
            $(to).show("slide", null, 300);
            hideLoader();
        });
        //$("#layout-back-btn").data("backto", from);
    }
    if (to == "#material-menu" || to == "#file-list-menu") {
        $("#layout-back-btn").addClass("hidden");
        $("#demo-menu-top-left").show();
    } else {
        $("#layout-back-btn").removeClass("hidden");
        $("#demo-menu-top-left").hide();
    }
}

function createGuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function secondsToTime(secs) {
    secs = Math.round(secs);
    var hours = Math.floor(secs / (60 * 60));

    var divisor_for_minutes = secs % (60 * 60);
    var minutes = Math.floor(divisor_for_minutes / 60);

    var divisor_for_seconds = divisor_for_minutes % 60;
    var seconds = Math.ceil(divisor_for_seconds);
    var obj = (hours < 10) ? "0" + hours : hours; obj += ":"
    obj += (minutes < 10) ? "0" + minutes : minutes + ":"; obj += ":"
    obj += (seconds < 10) ? "0" + seconds : seconds;
              
    //var obj = {
    //    "h": (hours < 10) ? "0"+hours : hours,
    //    "m": (minutes < 10) ? "0"+minutes : minutes,
    //    "s": (seconds < 10) ? "0"+ seconds : seconds
    //};
    return obj;
}

function isJSON(str) {
    try {
        var objJSON = JSON.parse(str);
        return objJSON;
    }
    catch (reason) {
        return false;
    }
}

function getUserInfo() {
    try {
        var instance = gapi.auth2.getAuthInstance();
        if (instance) {
            var UserInfo = instance.currentUser.Aia.value.w3;
            if (UserInfo) {
                UserInfo["IT"] = UserInfo['ofa'].charAt(0);
            }
            return UserInfo;
        }
    } catch (ex) {
        return { "IT": '?',"U3":"unknown" };
    }
}

//function ResizeModal(id, opts) {
//    var modal = $("#" + id), docH = $(document).height(), docW = $(document).width();
//    if (opts == "F") {
//        modal.data("maximized", true);
//        modal.data({ "oheight": modal.height(), "owidth": modal.width() });
//        modal.height("100%");
//        modal.width("100%");
//        modal.parent().parent().css({ 'width': "100%", 'height': "100%" });
//    } else {
//        modal.data("maximized", false);
//        var oH = modal.data("oheight"), oW = modal.data("owidth");
//        modal.height(oH);
//        modal.width(oW);
//        modal.parent().parent().css({ 'width': oH, 'height': oW });
//    }
//}

function CreateDataTable(data, cwFields) {
    try{
        if (data && data.up()) {
            var colNum = data.getNumberOfColumns(),rowNum = data.getNumberOfRows();//rows and col count
            var dataCol = data.up().cols, dataRow = data.up().rows;// cols and rows Data
            var ColStruct = createDataStruture(dataCol), dataSource = [];
            for (var j = 1; j < dataRow.length; j++) {
                var ro = dataRow[j]['c'],newObj = {};;
                for (var k = 0; k < ro.length; k++) {
                    newObj[ColStruct[k].name] = dataRow[j]['c'][k]['v'];
                }
                if (cwFields) {
                    for (var l = 0; l < cwFields.length ; l++)
                        newObj[cwFields[l]] = null;
                }
                dataSource.push(newObj);
            }
            return dataSource;
            //for (var i = 0; i < dataRow.length; i++) {
            //    dataSource.push(createObjectStruture(dataRow[i]['c']));
            //}
        }
    } catch (ex) {
        showNotification("toast", "Error: " + ex.message, "error");
    }
    function createDataStruture(dataR) {//create cols data types
        var ColStruct = [];
        for (var j = 0; j < dataCol.length; j++) {
            if (dataCol[j]['label'] && dataCol[j]['label'] != '')
                ColStruct.push({ 'col': dataCol[j]['id'], 'type': dataCol[j]['type'], 'name': dataCol[j]['label'] });
            else
                ColStruct.push({ 'col': dataCol[j]['id'], 'type': dataCol[j]['type'], 'name': dataRow[0]['c'][j]['v'] });
        }
        return ColStruct;
    }
}