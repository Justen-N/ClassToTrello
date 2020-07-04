function init() {
    const appRedirect = chrome.identity.getRedirectURL();
    const canvas_url = "https://byui.instructure.com/api/v1/"
    url = location.href;
    if (url.includes('token')) {
        token = url.split('=')[1]
        localStorage.setItem("trello_token", token);
        $("#trello_logged_out").css("display", "none");
        $('#trello_logged_in').css("display", "block");
    }
    let tToken = localStorage.getItem("trello_token");
    if (tToken) {
        Trello.setKey(APP_KEY);
        Trello.setToken(tToken)
        Trello.authorize({
            name: "Canvas to Trello",
            expiration: "never",
            interactive: "false",
            scope: {
                read: true,
                write: true
            },
            success: function () {
                console.log("Trello Authentication Successful.");
            },
            error: function () {
                console.log("Auth Failed");
                //todo: inform the user that auth failed. 
            }
        });
    }
    $("#connectTrello").click(function () {
        Trello.authorize({
            type: "redirect",
            name: "Class to Trello",
            interactive: true,
            return_url: appRedirect,
            scope: {
                read: true,
                write: true
            },
            expiration: "never"
        });
        $("#trello_logged_out").css("display", "none");
        $('#trello_logged_in').css("display", "block");
    });


    //trello logout button logic
    $("#disconnectTrello").click(function () {
        Trello.deauthorize();
        localStorage.removeItem("trello_token");
        $("#trello_logged_in").css("display", "none");
        $("#trello_logged_out").css("display", "initial");
        location.reload();
    });
    $("#canvas-access").click(function () {
        window.open('./popup.html')
    });
    $("#trelloTutorial").click(function () {
        if (Trello.token()) {
            if (!localStorage.getItem('tutorialBoard')) {
                Trello.post("boards", {
                    name: "CTT Tutorial Board",
                    desc: "A short tutorial in using Trello to manage your school work",
                    idBoardSource: "5de6a962ec1e3a8fd67c27a2",
                    keepFromSource: "cards"
                }).done(function (data) {
                    console.debug(data)
                    localStorage.setItem('tutorialBoard', data.url);
                }).fail(function () {
                    console.error('Could not create Tutorial Board')
                })
            }
            //We will attempt to navigate to the board we created in any case.
            window.open(localStorage.getItem('tutorialBoard'))
        }

    });


    // this happens too much, but I can't be sure where this should be set, because my head hurts from redirects. 
    if (tToken) {
        $("#trello_logged_out").css("display", "none");
        $('#trello_logged_in').css("display", "block");
    } else {
        $("#trello_logged_out").css("display", "block");
        $('#trello_logged_in').css("display", "none");
    }

    $('#canvas-load').click(function () {
        // shows the loading animations
        $('.lds-grid').css("display", "inline-block");
        var token = localStorage.getItem("canvas_token");

        if (token) {
            courses = $.get(canvas_url + "courses?access_token=" + token, {
                "enrollment_type": "student",
                "enrollment_state": "active",
                "exclude_blueprint_courses": true
            })
            details = courses.then(function (data, status, xhr) {
                // in here we get the course id, name and start_date values from the student's enrolled courses.
                var temp = xhr.responseJSON;
                let courseDetails = new Array();
                //console.debug(temp);
                for (record in temp) {
                    //console.debug(temp[record].name)

                    details = {
                        name: temp[record].name,
                        id: temp[record].id,
                        start_date: temp[record].start_at
                    }
                    if (details.name.includes("Majors") || details.name.includes("Devotional")) {
                        continue;
                    } else {
                        courseDetails.push(details);
                        $("#infoScroll").append(temp[record].name + " Found!<br>")
                    }
                }
                //console.debug(courseDetails);
                return courseDetails;
            }, function () {
                $("#infoScroll").innerhtml("Unable to find any course details. Please check your settings.")
            });

            assignments = details.then(function (data) {
                //this mess creates the assignments arrays to process
                //console.debug(data)
                var assignmentArray = new Array();
                for (record in data) {
                    //console.debug(record);
                    $.get(canvas_url + "courses/" + data[record].id + "/assignment_groups?access_token=" + token, {
                        'include': ['assignments', 'all_dates']
                    }).done(function (data) {
                        assignmentArray.push(data);
                    })
                    $('#infoScroll').append(data[record].name + " Assignments Loaded!<br>");
                }
                //console.debug(assignmentArray);
                return assignmentArray;
            }, function () {d 
                $("#infoScroll").innerhtml("Unable to find any course details. Please check your settings.")
            })
            board = details.then(function (data) {
                // this creates the Semester Specific board, and saves the url to a local variable
                //console.debug(data);
                var month = data[0].start_date.slice(6, 7)
                var year = data[0].start_date.slice(0, 4);
                //console.debug(month)
                //console.debug(year)
                var semester = {
                    '4': 'Spring',
                    '7': 'Summer',
                    '9': 'Fall',
                    '1': 'Winter'
                }
                var name = semester[month] + ' ' + year + '' + ' CTT Board'
               
                if (!localStorage.getItem(name)) {
                    boardRequest = Trello.post("boards", {
                        name: name,
                        desc: 'Assignment Tracking Board for CTT',
                        idBoardSource: '5de6a50cdea679015427df47'
                    }).done(function (data, status,request) {
                        localStorage.setItem(name, data.url)
                        return request;
                    })
                return boardRequest;
                } else {
                    console.error('Unable to create the Current Semester Board')
                }

            })
            var final = Promise.all([details, board]).then(function (values){
                //console.debug(values);
                var courses = values[0];
                var board = values[1].id;
                const labelColors = ['yellow','purple','blue','red','green','orange','black','sky', 'pink','lime'];
                var labelParams = new Array();
                for(var i = 0;i <courses.length;i++) {
                    
                    var labelInfo = {
                        name:courses[i].name,
                        color:labelColors[i],
                        idBoard: board
                    }
                    //console.debug(labelInfo)
                    labelParams.push(labelInfo)
                };
                var labelPostData  = new Array();
                for (label in labelParams){
                    //console.log(labelParams[label])
                    var postData =Trello.post('labels',labelParams[label])
                    labelPostData.push(postData)
                }
                return labelPostData;
            })
            Promise.all([assignments,details,final]).then(function(values){
            console.log(values);
            var unified_data= _.zip([values[0],values[1],values[2]])
                console.debug(unified_data);
            })

        }

    })
}

$(document).ready(init);