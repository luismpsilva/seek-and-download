(function () { 
    "use strict";
    document.addEventListener('deviceready', onDeviceReady.bind(this), false);
    function onDeviceReady() {
        //My code is here
        BigLoading();
        createAplication();
        // TODO: Cordova has been loaded. Perform any initialization that requires Cordova here.
        // Handle the Cordova pause and resume events
        document.addEventListener('pause', onPause.bind( this ), false );
        document.addEventListener('resume', onResume.bind(this), false);
    };

    function onPause() {
        // TODO: This application has been suspended. Save application state here.
    };

    function onResume() {
        // TODO: This application has been reactivated. Restore application state here.
    };
})();

function createAplication(isCordova) {
    var config, StartFunc;
    loadOAuth();
    $("#intro").attr("width", window.innerWidth);
    $("#intro").attr("height", window.innerHeight);
    BigLoading();
}

function onShowViewLogin(e) {
    if (!obs_Master) {
        obs_Master = new kendo.observable({
            loginHandler: {
                isVisible_Loader: true,
                isVisible_LogBtn: false,
                userInfo: null,
                logOut: function () {
                    showLoader();
                    handleAuthClick(null, true);
                },
                logIn:function(){
                    showLoader();
                    handleAuthClick();
                },
                afterLoggedIn:function(){
                    obs_Master.loginHandler.set("isVisible_Loader", false);
                    gapi.client.load('youtube', 'v3');
                    var d = $.Deferred();
                    obs_Master.fileHandler.getFileList(d);
                    d.then(function () {
                        navigate(null, "#login-main", "#material-menu");
                        obs_Master.loginHandler.set("userInfo", getUserInfo())
                        kendo.bind($("#left-drawer"), obs_Master.loginHandler);
                        hideLoader();
                    });
                },
                cleanData: function () {
                    this.set("isVisible_Loader", false);
                    this.set("isVisible_LogBtn", true);
                    this.set("userInfo", null);
                    navigate(null, "#material-menu", "#login-main");
                },
            },
            fileHandler: {
                getFileList: function (defer) {
                    showLoader();
                    FileLister().then(function (r) {
                        if (!$("#listview-file-list").data("kendoMobileListView")) {
                            $("#listview-file-list").kendoMobileListView({
                                dataSource: r,
                                template: $("#listview-files-list-template").html(),
                            });
                            $("#listview-file-list-filter").keyup(function (e) {
                                var filterString = e.target.value;
                                $("#listview-file-list").data("kendoMobileListView").dataSource.filter({ field: "name", operator: "startswith", value: filterString });
                            });
                        } else {
                            $("#listview-file-list").data("kendoMobileListView").setDataSource(r);
                        }
                        defer.resolve();
                    }, function (ex) {
                        hideLoader();
                        showNotification('snackbar', ex, 'error');
                    });
                }
            }
        });
    }
    kendo.bind($("#login-main"), obs_Master.loginHandler);
}

function loadOAuth() {
    handleClientLoad();
    /**
     *  On load, called to load the auth2 library and API client library.
     */
    function handleClientLoad() {
        gapi.load('client:auth2', initClient);
    }
    /**
     *  Initializes the API client library and sets up sign-in state
     *  listeners.
     */
    function initClient() {
        gapi.client.init({
            discoveryDocs: DISCOVERY_DOCS,
            clientId: CLIENT_ID,
            scope: SCOPES,
        }).then(function () {
            gapi.auth2.getAuthInstance();
            // Listen for sign-in state changes.
            gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
            // Handle the initial sign-in state.
            updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
        }, function (ex) {
            showNotification('toast', "Error in OAuth:" + ex.details, 'error');
        });
    }
    /**
     *  Called when the signed in status changes, to update the UI
     *  appropriately. After a sign-in, the API is called.
     */
    function updateSigninStatus(isSignedIn) {
        if (isSignedIn) {
            showNotification('toast', "Logged In. Redirecting...", 'success');
            delay(obs_Master.loginHandler.afterLoggedIn, 2000);
            //logged in
        } else {
            obs_Master.set("loginHandler.isVisible_LogBtn", true);
            obs_Master.set("loginHandler.isVisible_Loader", false);
            //logged out
        }
    }
}
/**
*  Sign in the user upon button click.
*/
function handleAuthClick(e, LogOut) {
    if (LogOut) {
        handleSignoutClick().then(function () {
            obs_Master.loginHandler.cleanData();
            hideLoader();
        },fail);
    }
    else {
        handleSigninClick().then(function () {
            showNotification('toast', "Logged In. Redirecting...", 'success');
            delay(obs_Master.loginHandler.afterLoggedIn, 2000);
        },fail);
    }
    /**
     *  Sign in the user upon button click.
     */
    function handleSigninClick(event) {
        return $.Deferred(function () {
            var that = this;
            gapi.auth2.getAuthInstance().signIn().then(function () {
                that.resolve();
            }, function (ex) {
                that.reject(ex);
            });
        });
    }

    /**
     *  Sign out the user upon button click.
     */
    function handleSignoutClick(event, defer) {
        return $.Deferred(function () {
            var that = this;
            gapi.auth2.getAuthInstance().signOut().then(function () {
                that.resolve();
            });
        }, function (ex) {
            that.reject(ex);
        });
    }

    var fail = function (ex) {
        hideLoader();
        showNotification('snackbar', ex, 'error');
    }
}

function getDataSheetColumns(id,select) {
    return $.Deferred(function () {
        var that = this;
        getColumns(id, select);
        function getColumns(id) {
            var selectStr = select ? select : 'SELECT *';
            var queryString = encodeURIComponent(selectStr);
            var tqUrl = 'https://docs.google.com/spreadsheets/d/' + id +
                        '/gviz/tq?tqx=responseHandler:handleTqResponse&tq=' + queryString + '&access_token=' + encodeURIComponent(gapi.auth2._gt().access_token);

            var query = new google.visualization.Query(tqUrl, { sendMethod: 'auto' });
            //'https://docs.google.com/spreadsheets/d/' + id + '/gviz/tq?sheet=Sheet1&headers=1&tq='
            query.send(handleSampleDataQueryResponse);
        }
        function handleSampleDataQueryResponse(response) {
            if (response.isError()) {
                var er = 'Error in query: ' + response.getMessage() + ' ' + response.getDetailedMessage();
                that.reject(er);
            } else {
                var data = response.getDataTable();
                that.resolve(data);
            }
        }
    });
}

//function getDataSheet2(id, defer) {
//    return $.Deferred(function () {
//        var that = this;
//        drawSheetName();
//        function drawSheetName() {
//            var queryString = encodeURIComponent('SELECT A,B LIMIT 5 OFFSET 8');
//            var query = new google.visualization.Query(
//                'https://docs.google.com/spreadsheets/d/' + id + '/gviz/tq?sheet=Sheet1&headers=1&tq=' + queryString);
//            //'https://docs.google.com/spreadsheets/d/' + id + '/gviz/tq?sheet=Sheet1&headers=1&tq='
//            query.send(handleSampleDataQueryResponse);
//        }

//        function handleSampleDataQueryResponse(response) {
//            if (response.isError()) {
//                alert('Error in query: ' + response.getMessage() + ' ' + response.getDetailedMessage());
//                return;
//            }
//            var data = response.getDataTable();
//        }
//    })
//}

function getDataSheet(id) {
    return $.Deferred(function () {
        var that = this;
        gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: id,
            range: 'A1:B7',
            majorDimension: "ROWS",
            //valueRenderOption:FORMATTED_VALUE | UNFORMATTED_VALUE | FORMULA
            //dateTimeRenderOption SERIAL_NUMBER  | FORMATTED_STRING
        }).then(function (response) {
            var range = response.result;
            var r = [];
            if (range.values.length > 0) {
                for (i = 0; i < range.values.length; i++) {
                    if (i == 0) {
                        var colNames = [];
                        for(j = 0; j < range.values[i].length; j++){
                            colNames.push(range.values[i][j]);
                        }
                    } else {
                        var obj = new Object();
                        for (var j = 0; j < range.values[i].length; j++) {
                            obj[colNames[j]] = range.values[i][j];
                            if (!obj["tag"])
                                obj["tag"] = range.values[i][j];
                            else
                                obj["tag"] += " " + range.values[i][j];
                        }
                        obj["id"] = createGuid();
                        r.push(obj);
                    }
                }
            }
            var promises = []
            for (var i = 0; i < r.length; i++) {
                var d = $.Deferred();
                promises.push(d);
                search(r[i], d);
            }
            $.when.apply($, promises).done(function () {
                var t = $.Deferred();
                for (var i = 0; i < r.length; i++) {
                    r[i]["link"] = "http://youtubeplaylist-mp3.com/download/index/" + r[i].videoId;
                    //Link2DownloadGenerator(r[i], r.length, t);
                }
                //t.then(function () {
                    that.resolve(r);
                //});
            });
        }, function (response) {
            hideLoader();
            showNotification('snackbar', response.result.error.message, 'error');
            that.reject();
        });
    });
}

/**
* Print files.
*/
function FileLister(type) {
    return $.Deferred(function () {
        var that = this;
        var filter = (type) ? type : "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false";
        gapi.client.drive.files.list({
            'pageSize': 10,
            'fields': "nextPageToken, files",
            'q': filter
        }).then(function (response) {
            var files = response.result.files;
            var dataSource = [];
            if (files && files.length > 0) {
                for (var i = 0; i < files.length; i++) {
                    var file = files[i];
                    dataSource.push(file);
                }
            } else {
                dataSource.push({ id: null, name: "No files found." });
            }
            that.resolve(dataSource);
        }, function (ex) {
            that.reject(ex);
        });
    });
}

//var temp = 0;
//function Link2DownloadGenerator(o, size, d) {
//    if (o.videoId) {
//        $.ajax({
//            type: "GET",
//            //dataType: "json",
//            url: "https://www.youtubeinmp3.com/fetch/?format=JSON&video=" + "https://www.youtube.com/watch?v=" + o.videoId,
//            success: function (data) {
//                try {
//                    if (isJSON(data)) {
//                        var jData = isJSON(data);
//                        if (jData && jData.link) {
//                            o["link"] = jData.link;
//                            o["length"] = secondsToTime(jData.length);
//                        }
//                        inc(size, d);
//                    } else {
//                        var found = false;
//                        if ($(data + 'meta[property=og:url]').attr("content")) {
//                            var l = $(data + 'meta[property=og:url]').attr("content");
//                            l = (l && l.length > 0 && l.split(";").length > 0) ? l.split(";") : [];
//                            l = (l && l.length > 0 && l[1].split(/=(.+)/).length > 0) ? l[1].split(/=(.+)/) : [];
//                            if (l && l.length && l[1]) {
//                                found = true;
//                                o["link"] = l[1];
//                                o["length"] = "00:00:00";
//                                inc(size, d);
//                            }
//                        }
//                        if (!found) {
//                            o["link"] = undefined;
//                            o["length"] = "00:00:00";
//                            inc(size, d);
//                        }
//                    }
//                }
//                catch (ex) {
//                    hideLoader();
//                    showNotification('snackbar', ex, 'error');
//                    console.log(ex);
//                    inc(size, d);
//                }
//            },
//            error: function (xhr, status, error) {
//                hideLoader();
//                showNotification('snackbar', error, 'error');
//                inc(size, d);
//            }
//        });
//    } else {
//        inc(size, d)
//    }
//    function inc(size, d) {
//        temp++
//        if (temp == size) {
//            d.resolve();
//        }
//    }
//}

// Search for a specified string.
function search(o, defer, one) {
    var request = gapi.client.youtube.search.list({
        q: o.tag,
        part: 'snippet'
    });
    request.execute(function (response) {
        if (response.result && response.result.items.length > 0 && response.result.items[0].id.videoId) {
            o["VID_ID"] = response.result.items[0].id.videoId;
            o["VID_LIST"] = (!one) ? response.result.items : null;
            o["LINK"] = "http://youtubeplaylist-mp3.com/download/index/" + response.result.items[0].id.videoId;
            defer.resolve();
        } else {
            defer.resolve();
        }
    });
}

function onShowModalListMoreMusic(e) {
    if (e && e.target) {
        var id = $(e.target).data("itemid"), list = $("#listview-file-data").data("kendoMobileListView"),
        list = list.dataSource.data(), promise = [];//list.dataSource.get(id).videoList
        for (var x = 0, length = list.length ; x < length; x++) {
            if (list[x].id == id) {
                list = list[x].VID_LIST;
                break;
            }
        }
        for (var i = 0; i < list.length; i++) {
            var d = $.Deferred();
            promise.push(d);
            list[i]["tag"] = list[i].snippet.title;
            list[i]["Autor"] = list[i].snippet.title.split("-")[0];
            list[i]["Titulo"] = list[i].snippet.title.split("-")[1];
            list[i]["lenght"] = "";
            search(list[i], d,true);
        }
        $.when.apply(undefined, promise).done(function () {
            if (!$("#listview-list-more-music").data("kendoMobileListView")) {
                $("#listview-list-more-music").kendoMobileListView({
                    style: "inset",
                    dataSource: new kendo.data.DataSource({ data: list }),
                    template: $("#listview-files-data-template").html(),
                });
            }
        });
    }
}

function onCloseModalListMoreMusic(e) {
    if ($("#listview-list-more-music").data("kendoMobileListView")) {
        $("#listview-list-more-music").data("kendoMobileListView").destroy();
    }
    
}

function close_ModalDataSheetOptions() {
    obs_DataSheetOptions.cleanDataSource();
}

function open_ModalDataSheetOptions(e) {
    var id = $(e.target).data("id");
    if (!obs_DataSheetOptions) {
        obs_DataSheetOptions = new kendo.observable({
            file_Id: id,
            step1: true,
            step2: false,
            operation: null,
            dataSourceColumnsSelec:[],
            dataSourceColumnsUnselec: [],
            click_SelectColumn: function (e) {
                var dataItem = e.dataItem;
                if (!dataItem.selected) {
                    if (this.dataSourceColumnsSelec.length < 2) {
                        e.dataItem.set("selected", true);
                        this.dataSourceColumnsSelec.push(e.dataItem);
                        this.dataSourceColumnsUnselec.remove(e.dataItem);
                    }
                } else {
                    e.dataItem.set("selected", false);
                    this.dataSourceColumnsSelec.remove(e.dataItem);
                    this.dataSourceColumnsUnselec.push(e.dataItem);
                }
            },
            click_showData: function () {
                if (this.dataSourceColumnsSelec.length > 0) {
                    var data = this.dataSourceColumnsSelec;
                    var select = 'SELECT ';
                    for (var i = 0; i < data.length; i++) {
                        if ((data.length - 1) != i)
                            select += data[i]['col'] + ',';
                        else
                            select += data[i]['col'];
                    }
                    getDataSheetColumns(this.file_Id, select).then(function (r) {
                        var dataDT = CreateDataTable(r);
                        showNotification('toast', 'Not implemented... :/ For now!', "error");
                        console.log(dataDT);
                    }, function (ex) {
                        showNotification('toast', 'Erro: ' + ex, "error");
                    });
                }
                //$("#masterGrid").kendoGrid({
                //    dataSource: {},
                //    //height: 550,
                //    groupable: false,
                //    sortable: false,
                //    pageable: {
                //        refresh: true,
                //        pageSizes: true,
                //        buttonCount: 5
                //    },
                //    columns: []
                //});
            },
            showColumns: function () {
                if (this.file_Id) {
                    showLoader();
                    getDataSheetColumns(this.file_Id).then(function (data) {
                        console.log(data);
                        var dataS = CreateDataTable(data, null, true);
                        for(var i = 0; i < dataS.length; i++)
                            dataS[i]['selected'] = false;
                        obs_DataSheetOptions.set("dataSourceColumnsUnselec", dataS);
                        //ResizeModal("modalview-config-list", "F");
                        obs_DataSheetOptions.set("step1", false);
                        obs_DataSheetOptions.set("step2", true);
                        hideLoader();
                    }).fail(function (ex) {
                        hideLoader();
                        showNotification('toast', ex, 'error');
                    });
                } else
                    showNotification('toast', 'Not a valid file: No ID was found.', 'warning');
            },
            musicListData: function (data) {
                return new kendo.data.DataSource({
                    data: data,
                    schema: {
                        model: { id: "id" }
                    }
                });
            },
            open_ListDataSheet: function () {

            },
            open_MusicDataSheet: function (e) {
                var view = $(e.currentTarget).data("viewname");
                //if (view && view != '') {
                showLoader();
                closeModalView(null, view);
                navigate(null, "#file-list-menu", "#file-data-menu", true);
                if (this.file_Id) {
                    $("#listview-file-data-filter").val(null);
                    getDataSheetColumns(this.file_Id, "SELECT A, B").then(function (rsp) {
                        var dataTable = CreateDataTable(rsp, ['tag', 'VID_LIST', 'VID_ID']);//CreateDataTable2(rsp, ['Autor', 'Titulo']);
                        var promises = []
                        for (var i = 0; i < dataTable.length; i++) {
                            dataTable[i]["tag"] = dataTable[i][Object.keys(dataTable[i])[0]] + " " + dataTable[i][Object.keys(dataTable[i])[1]];
                            dataTable[i]["id"] = createGuid();
                            var d = $.Deferred();
                            promises.push(d);
                            search(dataTable[i], d);
                        }
                        $.when.apply($, promises).done(function () {
                            if (!$("#listview-file-data").data("kendoMobileListView")) {
                                $("#listview-file-data").kendoMobileListView({
                                    dataSource: obs_DataSheetOptions.musicListData(dataTable),
                                    template: $("#listview-files-data-template").html(),
                                });
                                $("#listview-file-data-filter").keyup(function (e) {
                                    var filterString = e.target.value;
                                    $("#listview-file-data").data("kendoMobileListView").dataSource
                                        .filter({ field: "Autor", operator: "startswith", value: filterString });
                                });
                            } else {
                                $("#listview-file-data").data("kendoMobileListView").setDataSource(obs_DataSheetOptions.musicListData(dataTable));
                            }
                            hideLoader();
                        });
                    });

                    //getDataSheet(id).then(function (r) {
                    //    if (!$("#listview-file-data").data("kendoMobileListView")) {
                    //        $("#listview-file-data").kendoMobileListView({
                    //            dataSource: obs_DataSheetOptions.musicListData(r),
                    //            template: $("#listview-files-data-template").html(),
                    //        });
                    //        $("#listview-file-data-filter").keyup(function (e) {
                    //            var filterString = e.target.value;
                    //            $("#listview-file-data").data("kendoMobileListView").dataSource.filter({ field: "Autor", operator: "startswith", value: filterString });
                    //        });
                    //    } else {
                    //        $("#listview-file-data").data("kendoMobileListView").setDataSource(obs_DataSheetOptions.musicListData(r));
                    //    }
                    //    hideLoader();
                    //});
                }
                else
                    showNotification('snackbar', 'Not a valid file: No ID was found.', 'warning');
                //}
            },
            clean: function () {
                this.set("step1", true);
                this.set("step2", false);
                this.set("file_Id", null);
                this.set("operation", null);
                //ResizeModal("modalview-config-list");
            },
            cleanDataSource: function () {
                this.set("dataSourceColumnsSelec", []);
                this.set("dataSourceColumnsUnselec", []);
            }
        });
    } else {
        obs_DataSheetOptions.clean();
        obs_DataSheetOptions.set("file_Id", id);
        obs_DataSheetOptions.set("operation", $(e.target).data("oper"));
    }
    kendo.bind(e.sender.element, obs_DataSheetOptions);
}

function close_FileDataMenu() {
    $("#listview-file-data").data("kendoMobileListView").setDataSource(obs_DataSheetOptions.musicListData([]));
    console.log("OnClose Fired");
}

function click_FilterDrive(type) {
    showLoader();
    switch (type) {
        case 'all':
            FileLister("trashed=false").then(function (data) {
                $("#listview-file-list").data("kendoMobileListView").setDataSource(data);
                hideLoader();
            });
            break;
        case 'sheet':
            FileLister("mimeType='application/vnd.google-apps.spreadsheet' and trashed=false").then(function (data) {
                $("#listview-file-list").data("kendoMobileListView").setDataSource(data);
                hideLoader();
            });
            break;
        case 'doc':
            FileLister("mimeType='application/vnd.google-apps.document' and trashed=false").then(function (data) {
                $("#listview-file-list").data("kendoMobileListView").setDataSource(data);
                hideLoader();
            });
            break;
        case 'other':
            var filter = "mimeType!='application/vnd.google-apps.spreadsheet' and " +
                         "mimeType!='application/vnd.google-apps.document' and " +
                         "mimeType!='application/vnd.google-apps.folder' "+
                         "and trashed=false";
            
            FileLister(filter).then(function (data) {
                $("#listview-file-list").data("kendoMobileListView").setDataSource(data);
                hideLoader();
            });
            break;
    }
}