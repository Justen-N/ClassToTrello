moment().format();

function chunkArray(arr, len) {
    var chunks = [],
        i = 0,
        n = arr.length;
    while (i < n) {
        chunks.push(arr.slice(i, i += len));
    }
    return chunks;
}

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
        $('.lds-grid').show();
        var token = localStorage.getItem("canvas_token");

        if (token) {
            courses = $.get(canvas_url + "courses?access_token=" + token, {
                "enrollment_type": "student",
                "enrollment_state": "active",
                "exclude_blueprint_courses": true
            })
            details = courses.then(async function (data, status, xhr) {
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
                        $("#infoScroll").append('<li>'+ temp[record].name + " Found.</li>")
                    }
                }
                await courseDetails[data.length - 1]
                return courseDetails;
            })

            assignments = details.then(async function (data) {
                    //this mess creates the assignments arrays to process
                    //console.debug(data)
                    var assignmentArray = new Array();
                    for (record in data) {
                        //console.debug(record);
                        assignmentArray.push($.get(canvas_url + "courses/" + data[record].id + "/assignment_groups?access_token=" + token, {
                            'include': ['assignments', 'all_dates']
                        }).done(function () {
                            $("#infoScroll").append(`<li>Course Assignments loaded.</li>`)
                        }))
                        //console.log(assignmentArray);
                    }
                    //console.debug(assignmentArray);
                    if (assignmentArray.length == data.length) {
                        return Promise.all(assignmentArray)
                    }

                },
                function () {
                    $("#infoScroll").html("Unable to find any course details. Please check your settings.")
                })
            board = details.then(function (data) {
                // this creates the Semester Specific board, and saves the url to a local variable
                //console.debug(data);
                var month = data[0].start_date.slice(6, 7);
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
                    }).done(function (data, status, request) {
                        localStorage.setItem(name, data.url)
                        return request;
                    })
                    return boardRequest;
                } else {
                    console.error('Unable to create the Current Semester Board')
                }

            })
            var final = Promise.all([details, board]).then(async function (values) {
                //console.debug(values);
                var courses = values[0];
                var board = values[1].id;
                const labelColors = ['yellow', 'purple', 'blue', 'red', 'green', 'orange', 'black', 'sky', 'pink', 'lime'];
                var labelParams = new Array();
                for (var i = 0; i < courses.length; i++) {

                    var labelInfo = {
                        name: courses[i].name,
                        color: labelColors[i],
                        idBoard: board
                    }
                    //console.debug(labelInfo)
                    labelParams.push(labelInfo)
                };
                var labelPostData = new Array();
                for (label in labelParams) {
                    //console.log(labelParams[label])
                    var postData = Trello.post('labels', labelParams[label])
                    labelPostData.push(postData)
                }
                await labelPostData[labelParams.length - 1];
                return labelPostData;
            })

            var carded = Promise.all([final.then(function (data) {
                return data;
            }), assignments]).then(function (values) {
                console.log(values);
                board = values[0][0].responseJSON.idBoard;
                var cards = new Array()
                for (var i = 0; i < values[0].length; i++) {
                    label = values[0][i].responseJSON.id;
                    console.log(label);
                    for (assignment_group of values[1][i]) {
                        weight = assignment_group.group_weight;
                        for (assignment of assignment_group.assignments) {
                            console.log(assignment.id)
                            var card = {
                                cardName: assignment.name,
                                date: assignment.due_at,
                                link: assignment.html_url,
                                group_weight: weight,
                                points: assignment.points_possible,
                                idBoard: values[0][i].responseJSON.idBoard,
                                assigment_count: assignment_group.assignments.length,
                                labelId: label,
                                unlock_at: assignment.unlock_at
                            }
                            cards.push(card);
                        }
                    }
                }
                return cards;
            })
            var loaded = Promise.all([carded, board.then(function (data) {
                return Trello.get('boards/' + data.id + '/lists');
            })]).then(async function (data) {
                console.log(data);
                var splitAssignments = chunkArray(data[0], 25)
                console.log(splitAssignments);

                var i = 0;
                while (i < splitAssignments.length) {
                    var assignmentCards = "assignmentCards" + i;
                    chrome.storage.sync.set({
                        [assignmentCards]: splitAssignments[i]
                    }, function () {
                        console.log('Assignments saved to chrome storage')
                    })
                    var batch = [];
                    for (assignment of splitAssignments[i]) {
                        var newcard = {
                            name: assignment.cardName,
                            desc: "Total Points: " + assignment.points + " Canvas Link: " + assignment.link,
                            due: assignment.date ? Date.parse(assignment.date) : Date.now(),
                            idLabels: assignment.labelId,
                            idList: data[1][0].id
                        }
                        await Trello.post('cards', newcard).done(function(){
                            if($('#infoScroll li').length > 5){
                            $("#infoScroll li").slice(0,-5).hide();
                            }
                            $("#infoScroll").append("<li>"+ assignment.cardName + " Card created.</li>");

                        });
                    }
                    i++;
                }
            })
            loaded.finally(function (){
                $("#infoScroll").append("Semester Backlog fully populated. Sorry it took so long!");
                $('.lds-grid').hide();
            })
        }
    })
}

$(document).ready(init);