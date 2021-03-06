//init.js
$(document).ready(function() {
	//init namespace
    SimpleShifts = {};
	//utility constants
	var port = '';
	if(location.port){
		port = ':' + location.port;
	};
	var protocol = location.protocol;
	var baseURL = location.hostname;
	//cache DOM elements
	var calendarElem = $('#calendar');
	// utility functions
	var sortArrObj = function(inputArray, property) {
        var newObjArr = inputArray.sort(function(a,b){
            var nameA = a[property].toLowerCase(), nameB=b[property].toLowerCase();
            if (nameA < nameB) {
                return -1;
            }
            if (nameA > nameB) {
                return 1;
            }
            return 0
        });
        return newObjArr;
	};
	var hideAllShifts = function() {
        var currentView = calendarElem.fullCalendar('getView').name;
        if (currentView.indexOf('list') === -1) {
            $('.fc-event-container').addClass('invisible');
		} else {
			$('.fc-list-item').addClass('hidden');
            $('.fc-list-heading').addClass('hidden');
        }
	};
	var showShifts = function () {
        hideAllShifts()
        var currentView = calendarElem.fullCalendar('getView').name;
        if (currentView.indexOf('list') === -1) {//for cal view
            if (SimpleShifts.filteredEmp !== "none") { //show only shifts for filtered emp
                $( '.' +  SimpleShifts.filteredEmp).parent().removeClass('invisible');
            } else { //show for all emps
                $('.fc-event-container').removeClass('invisible');
            }
		} else {//for list view
            if (SimpleShifts.filteredEmp !== "none") {
                $( '.' +  SimpleShifts.filteredEmp).removeClass('hidden');
                $( '.' +  SimpleShifts.filteredEmp).each(
					function(i,obj){
                        $(this).prevAll('.fc-list-heading:first').removeClass('hidden')
                    }
				);
			} else {
				$('.fc-list-item').removeClass('hidden');
                $('.fc-list-heading').removeClass('hidden');
			}
		}
	};
    var validate = function(entry, type){
        if (type && type === 'email') {
            var reg = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            return reg.test(entry);
        }
        return Boolean(entry.length > 1);
    };
    var showClientSideErr = function (err) {
        $('#clientside-error').text(err);
    	$('#clientside-error').removeClass('hidden');
	};
    var hideClientSideErr = function() {
        $('#clientside-error').addClass('hidden');
        $('#clientside-error').text('Error');
	};
    var hideMessages = function() {
    	$('.alert').addClass('hidden');
	};
	var batchEditCancel = function() {
        calendarElem.fullCalendar('refetchEvents');
		SimpleShifts.updatesHopper = [];
		calendarElem.removeClass('unsaved');
	};
	var momentToString = function(myMoment) {
		return myMoment.format().split('T')[0];
	};
	var getEmpIdByName = function(name, obj) {
		for (var i = 0;i<obj.length;i++) {
			if (obj[i].name === name) {
				return obj[i].id;
				break;    			
			} else if (i === obj.length-1) {
				return ('empId for ' + name + ' not found');
			}
		}
	};
	var getShiftType = function (classList) {
		for (var i=0; i<classList.length; i++) {
			    if (classList[i] === 'UC' || classList[i] === 'Call' || classList[i] === 'Vacation' || classList[i] === 'UCS' || classList[i] === 'UCW' ) {
		        return classList[i];
		        break;
		    } else if (i === classList.length-1) {
				return ('shiftType not found');
			}
		      		
		}
	};

	var getShiftDayNight = function (classList) {
        for (var i=0; i<classList.length; i++) {
            if (classList[i] === 'day' || classList[i] === 'night' || classList[i] === 'unset') {
                return classList[i];
                break;
            } else if (i === classList.length-1) {
                return ('shiftDayNight not found');
            }

        }
	};
	var populateEmpLists = function () {
	    //populate employee list option elements
	    var empListElems = $('.empList');
	    var options = [];
	    var empData = SimpleShifts.empData;
	    //TODO - change storage of name in empModel.js to use 'fname' and 'lname', make 'name' a virtual
		//	   - the solution below is a temporary fix and can't handle names with spaces in them
	    for (var i=0;i<empData.length;i++) {
	    	empData[i].fname = empData[i].name.split(' ')[0];
	    	empData[i].lname = empData[i].name.split(' ')[1];
		}
		empData = sortArrObj(empData,'lname');
        //TODO - abstract dropdown population into a generic util function
		for (var i = 0; i<empData.length; i++) {
			options.push('<option value="', 
				empData[i].id,
				'">',
				empData[i].name,
				'</option>'
			);
		}	
		empListElems.html(options.join('')); 
	};
	//activate admin functions
	var activateAdminMode = function () {
		//activate editable
		calendarElem.fullCalendar('option','editable','true');
		//activate dayClick
		calendarElem.fullCalendar('option','dayClick',
			function(date){
		    	$('td.unsaved').removeClass('unsaved');
		    	if (SimpleShifts.selectedEvent !== "none") {
			    	$('#' + SimpleShifts.selectedEvent.id).removeClass('selected');
			    	SimpleShifts.selectedEvent = "none";
		    	}
		    	$('.form').addClass('hidden');
		    	$(this).addClass('unsaved');
		    	$('#add-shift-form').removeClass('hidden');
		    	var newDate = momentToString(date);
		    	$('#add-shiftDate').val(newDate);
			}
		);
		//activate eventClick
		calendarElem.fullCalendar('option', 'eventClick', function(calEvent, jsEvent, view) {
			var classList = $(this).attr('class').split(/\s+/);

	    	if (SimpleShifts.selectedEvent !== "none") {
	        	$('#' + SimpleShifts.selectedEvent.id).removeClass('selected');
	    	}
	    	SimpleShifts.selectedEvent = calEvent;
	    	$('#ed-shiftDate').val(momentToString(calEvent.start));	    
	    	$('#ed-shiftEmp').val(getEmpIdByName(calEvent.title,SimpleShifts.empData));
	    	$('#ed-shiftType').val( getShiftType(classList) );
            $('#ed-shiftTime').val( getShiftDayNight(classList) );
	    	$(this).addClass('selected');
			$('.form').addClass('hidden');
			$('#edit-shift-form').removeClass('hidden');
	    });
	    //activate eventDrop
	    calendarElem.fullCalendar('option', 'eventDrop', function (event) {
	    	$('.form').addClass('hidden');
	    	$('#batch-edit-form').removeClass('hidden');
	    	delete event["source"];
	    	event["start"].stripTime();
			if (SimpleShifts.updatesHopper.length == 0) {
	   				SimpleShifts.updatesHopper.push(event);
			} else {
	        	for (var i = 0; i < SimpleShifts.updatesHopper.length; i++) {
	        		if (event.id === SimpleShifts.updatesHopper[i].id) {
	        			SimpleShifts.updatesHopper[i] = event;
	        			break;
					} else if ( i == (SimpleShifts.updatesHopper.length-1) ) {
	 	       			SimpleShifts.updatesHopper.push(event);
					}
	        	}
	        }
	        calendarElem.addClass('unsaved');
	    });
		//activate admin listeners
		$('#add-shift-submit').click(function(){
			var empId = $('#add-shiftEmp').val();
			var title = $('#add-shiftEmp option:selected').text();
			var start = $('#add-shiftDate').val();
			var end = start;
            var shiftType = $('#add-shiftType').val();
            var dayNight = $('#add-shiftTime option:selected').val();
			var classArr = [
				title.toLowerCase().replace(/ /g,'-'), //shift title
				shiftType, //shift type
				dayNight //shift day or night
			];
			var newShiftData = {
			    "employee" : empId,
			    "title": title,
			    "start": start,
			    "end": end,
				"dayOrNight": dayNight,
			    "className": classArr,
			    "shiftType": classArr[1]
			};
			SimpleShifts.api.shifts.add(newShiftData);
		});
		$('#add-shift-cancel').click(function(){
			$('.form').addClass('hidden');
			$('td.unsaved').removeClass('unsaved');
		});
		$('#add-emp-submit').click(function(){
			var name = $('#add-empName').val();
			var newEmpData = {
				"name": name
			};
			SimpleShifts.api.employees.add(newEmpData);
			//TODO - get API call to return true or false. show error if false, otherwise a conf. msg
		});
		$('#delete-shift').click(function(){
			if(confirm("Are you sure you want to delete this shift?") == true) {
				SimpleShifts.api.shifts.delete(SimpleShifts.selectedEvent.id);
			}
		});
		$('#edit-shift-submit').click(function(){
			var title = $('#ed-shiftEmp option:selected').text();
			var empId = $('#ed-shiftEmp').val();
			var start = $('#ed-shiftDate').val();
			start += 'T00:00:00.000Z';
			var end = start;
            var dayNight = $('#ed-shiftTime').val();
            var shiftType = $('#ed-shiftType').val();
			var classArr = [
				title.toLowerCase().replace(/ /g,'-'), //shift title
				shiftType, //shift type
                dayNight //shift day or night
			];
			var updateShiftData = {
			    "employee" : empId,
			    "title": title,
			    "start": start,
			    "end": end,
                "dayOrNight": dayNight,
			    "className": classArr,
			    "shiftType": classArr[1]
			};
			SimpleShifts.api.shifts.singleUpdate(SimpleShifts.selectedEvent.id,updateShiftData);
		});
		$('#edit-shift-cancel').click(function(){
			$('#' + SimpleShifts.selectedEvent.id).removeClass('selected');
			$('.form').addClass('hidden');	
		});		    
		$('#batch-edit-save').click(function(){
			SimpleShifts.api.shifts.batchUpdate(SimpleShifts.updatesHopper);
		});
		$('#batch-edit-cancel').click(function(){
			$('.form').addClass('hidden');
			batchEditCancel();   	
		});
		$('#mng-emp-cancel').click(function(){
			$('#add-empName').val('');
			$('.form').addClass('hidden');
		});
		$('#delete-emp').click(function(){
			if(confirm("Are you sure you want to delete this employee?") == true) {
				var deleteID = $('#emp-select').val();
				SimpleShifts.api.employees.delete(deleteID);
			}		    	
		});
		$('#edit-emp-show').click(function(){
			var prepop = $('#emp-select option:selected').text();
			$('#edit-emp').val(prepop)
			$('#mng-emp-wrapper').addClass('hidden');
			$('#edit-emp-wrapper').removeClass('hidden');	
		});
		$('#edit-emp-cancel').click(function(){
			$('#edit-emp-wrapper').addClass('hidden');
			$('#mng-emp-wrapper').removeClass('hidden');	
		});
		$('#edit-emp-submit').click(function(){
			var updateID = $('#emp-select').val();
			var updateName = $('#edit-emp').val();
			var updateData = {"name": updateName};
			SimpleShifts.api.employees.singleUpdate(updateID,updateData);
		});		    
		$('#add-emp-show').click(function(){
			$('#mng-emp-wrapper').addClass('hidden');
			$('#add-emp-wrapper').removeClass('hidden');
		});		    
		$('#add-emp-back').click(function(){
			$('#add-emp-wrapper').addClass('hidden');
			$('#mng-emp-wrapper').removeClass('hidden');	
			$('#add-empName').val('');
		});
	};

	//init and retrieve data for the calendar
	SimpleShifts.selectedEvent = "none";
	SimpleShifts.selectedDay = "none";
	SimpleShifts.filteredEmp = "none";
	SimpleShifts.updatesHopper = [];
	SimpleShifts.empData = [];
	//properties for each shift data object
	SimpleShifts.shiftUrl = protocol + '//' + baseURL + port + '/api/shifts';
	SimpleShifts.empUrl = protocol + '//' + baseURL + port + '/api/employees';
	SimpleShifts.contentUrl = protocol + '//' + baseURL + port + '/api/content';
	SimpleShifts.userUrl = protocol + '//' + baseURL + port + '/api/user';
	//ajax functions
	//TODO - extract the updates that occur after a call is successful into separate functions
	SimpleShifts.api = {};
	SimpleShifts.api.shifts = {};
	SimpleShifts.api.employees = {};
	SimpleShifts.api.content = {};
	SimpleShifts.api.user = {};
	SimpleShifts.api.throwErr = function (jqxhr, textStatus, errorThrown) {
		if ($('#client-side-messages .alert-danger:first').length ) {
			$('#client-side-messages .alert-danger:first').text(errorThrown || 'Error on this action.');
			$('#client-side-messages .alert-danger:first').removeClass('hidden');
		}
	};
	//START - User ajax functions
	SimpleShifts.api.user.update = function(newCredentials) {
		$.ajax({
			url: SimpleShifts.userUrl,
			method: 'POST',
			data: JSON.stringify(newCredentials),
			contentType: 'application/json; charset=UTF-8', //format for the request
			processData: false,
			dataType: "text", //format for the response
			success: function () {
				$('#client-side-messages .alert-success:first').text('User ' + newCredentials.updateType + ' successfully updated');
				$('#client-side-messages .alert-success:first').removeClass('hidden');
				if (newCredentials.updateType === 'email') {
					$('#user-details-email span').text(newCredentials.local.email);
				}
			},
			error: function(jqxhr, textStatus, errorThrown){
				SimpleShifts.api.throwErr(jqxhr, textStatus, errorThrown);
			}				
		});
	};
	//START - Content ajax functions
	SimpleShifts.api.content.update = function(newContent) {
		$.ajax({
			url: SimpleShifts.contentUrl + '/' + newContent.name,
			method: 'PUT',
			data: JSON.stringify(newContent),
			contentType: 'application/json; charset=UTF-8', //format for the request
			processData: false,
			dataType: "text", //format for the response
			success: function () {
				$('#client-side-messages .alert-success:first').text('Content successfully updated');
				$('#client-side-messages .alert-success:first').removeClass('hidden');
			},
			error: function() {
				SimpleShifts.api.throwErr(jqxhr, textStatus, errorThrown);
			}			
		});
	};
	//START - Emp ajax functions
	SimpleShifts.api.employees.add = function(newEmp) {
		$.ajax({
			url: SimpleShifts.empUrl,
			method: 'POST',
			contentType: 'application/json; charset=UTF-8', //format for the request
			data: JSON.stringify(newEmp),
			dataType: "text", //format for the response
			processData: false,
			success: function () {
				SimpleShifts.api.employees.getAll();
				$('#add-empName').val('');
		    	$('.form').addClass('hidden');
			},
			error: function(jqxhr, textStatus, err) {
				SimpleShifts.api.throwErr(jqxhr, textStatus, err);
			}	
		});				
	};
	SimpleShifts.api.employees.delete = function(empId) {
		$.ajax({
			url: SimpleShifts.empUrl + '/' + empId,
			method: 'DELETE',
			dataType: "text", //format for the response
			success: function () {
				SimpleShifts.api.employees.getAll();
				populateEmpLists();
                calendarElem.fullCalendar('refetchEvents');
		    	$('.form').addClass('hidden');
			},
			error: function(jqxhr, textStatus, err) {
				SimpleShifts.api.throwErr(jqxhr, textStatus, err);
			}	
		});
	};
	SimpleShifts.api.employees.singleUpdate = function(empId, empUpdate) {
		$.ajax({
			url: SimpleShifts.empUrl + '/' + empId,
			method: 'PUT',
			data: JSON.stringify(empUpdate),
			contentType: 'application/json; charset=UTF-8', //format for the request
			processData: false,
			dataType: "text", //format for the response
			success: function () {
				SimpleShifts.api.employees.getAll();
				populateEmpLists();
                calendarElem.fullCalendar('refetchEvents');
		    	$('.form').addClass('hidden');
		    	$('#edit-emp-wrapper').addClass('hidden');
				$('#mng-emp-wrapper').removeClass('hidden');	
			},
			error: function(jqxhr, textStatus, err) {
				SimpleShifts.api.throwErr(jqxhr, textStatus, err);
			}	
		});
	};
	SimpleShifts.api.employees.getAll = function() {
		$.ajax({
			url: SimpleShifts.empUrl,
			method: 'GET',
			dataType: "text", //format for the response
			success: function (data) {
				SimpleShifts.empData = JSON.parse(data);
				populateEmpLists();
			},
			error: function(jqxhr, textStatus, err) {
				SimpleShifts.api.throwErr(jqxhr, textStatus, err);
			}	
		});
	};
	//START - Shift ajax functions
	SimpleShifts.api.shifts.add = function (newShift) {
		$.ajax({
			url: SimpleShifts.shiftUrl,
			method: 'POST',
			contentType: 'application/json; charset=UTF-8', //format for the request
			data: JSON.stringify(newShift),
			dataType: "text", //format for the response
			processData: false,
			success: function () {
                calendarElem.fullCalendar('refetchEvents');
		    	$('.form').addClass('hidden');
		    	$('td.unsaved').removeClass('unsaved');
		    	SimpleShifts.selectedDay = "none";
			},
			error: function(jqxhr, textStatus, err) {
				SimpleShifts.api.throwErr(jqxhr, textStatus, err);
			}	
		});
	};
	SimpleShifts.api.shifts.delete = function (shiftId) {
		$.ajax({
			url: SimpleShifts.shiftUrl + '/' + shiftId,
			method: 'DELETE',
			dataType: "text", //format for the response
			success: function () {
                calendarElem.fullCalendar('refetchEvents');
		    	$('.form').addClass('hidden');
			},
			error: function(jqxhr, textStatus, err) {
				SimpleShifts.api.throwErr(jqxhr, textStatus, err);
			}	
		});
	};
	SimpleShifts.api.shifts.singleUpdate = function (shiftId,shiftUpdate) {
		$.ajax({
			url: SimpleShifts.shiftUrl + '/' + shiftId,
			method: 'PUT',
			data: JSON.stringify(shiftUpdate),
			contentType: 'application/json; charset=UTF-8', //format for the request
			processData: false,
			dataType: "text", //format for the response
			success: function () {
                calendarElem.fullCalendar('refetchEvents');
		    	$('.form').addClass('hidden');
			},
			error: function(jqxhr, textStatus, err) {
				SimpleShifts.api.throwErr(jqxhr, textStatus, err);
			}	
		});
	};
	SimpleShifts.api.shifts.batchUpdate = function (updatesDataObj) {
			$.ajax({
				url: SimpleShifts.shiftUrl + '/multi',
				method: 'POST',
				data: JSON.stringify(updatesDataObj),
				contentType: 'application/json; charset=UTF-8', //format for the request
				processData: false,
				dataType: "text", //format for the response
				success: function () {
                    calendarElem.fullCalendar('refetchEvents');
					calendarElem.removeClass('unsaved');
					$('.form').addClass('hidden');
				},
				error: function(jqxhr, textStatus, err) {
					SimpleShifts.api.throwErr(jqxhr, textStatus, err);
				}	
			});	
	};
	SimpleShifts.api.shifts.getAll = function () {
		$.ajax({
			url: SimpleShifts.shiftUrl,
			method: 'GET',
			dataType: "text", //format for the response
			success: function () {
			},
			error: function(jqxhr, textStatus, err) {
				SimpleShifts.api.throwErr(jqxhr, textStatus, err);
			}	
		});
	};

	SimpleShifts.empData = SimpleShifts.api.employees.getAll();

	SimpleShifts.retrievedEvents = [
		{
			url: SimpleShifts.shiftUrl,
			type: 'GET',
			error: function(jqxhr, textStatus, err) {
				SimpleShifts.api.throwErr(jqxhr, textStatus, err);
			}	
		}								
	];

	SimpleShifts.events = SimpleShifts.retrievedEvents;
	//END - Shift ajax functions

	//initialize the calendar...
	calendarElem.fullCalendar({
	    // put your options and callbacks header
		eventOrder: 'shiftType',
		allDayDefault: true,
		views: {
			listYear: {
				type: 'list',
				duration: { months: 12}
			}
		},
	    customButtons: {
	    	chgView: {
	    		text: 'view',
				click: function () {
	    			var currentView = calendarElem.fullCalendar('getView').name;
	    			if (currentView.indexOf('list') === -1) { //in calendar view
                        calendarElem.fullCalendar('changeView', 'listYear');
					} else { //in list view
                        calendarElem.fullCalendar('changeView', 'month');
					}

				}
			},
	    	mngEmp: {
	    		text: 'emp',
	    		click: function () {
	    			$('.form').addClass('hidden');
	    			batchEditCancel();
	    			$('#mng-emp-form').removeClass('hidden');  		        			
	    		}
	    	},
	    	filter: {
	    		text: 'filter',
	    		click: function() {
	    			$('.form').addClass('hidden');
	    			batchEditCancel();
	    			$('#' + SimpleShifts.selectedEvent.id).removeClass('selected');
	    			$('#onedoc-form').removeClass('hidden');
	    		}
	    	}
	    },
	    displayEventTime: false,
	    editable: false,
	    eventRender: function(event, element) {
	    	element.attr("id",event._id);
	    },
		eventAfterAllRender: function () {
			showShifts();
		},
	    eventSources: SimpleShifts.events,
	    footer: {
	    	left:'',
	    	center: '',
	    	right:'cancelSave, saveChgs'
	    },
	    header: {
	    	left: 'title',
	    	center: 'mngEmp,filter,chgView',
	    	right: 'today prev,next'
	    }
	});
	//fix mobile date pickers		    
	if ( $('[type="date"]').length && $('[type="date"]').prop('type') != 'date' ) {
	    $('[type="date"]').datepicker();
	}
	//event listeners
	$('#showAllDocs').click(function(){
		SimpleShifts.filteredEmp = "none";
		showShifts();
		//$('.fc-event-container').removeClass('invisible');
		$('.form').addClass('hidden');	
	});
	$('#filterSubmit').click(function(){
		var filterName = $('#filterByDoc option:selected').text();
		filterName = filterName.toLowerCase().replace(' ','-');
		hideAllShifts();
		SimpleShifts.filteredEmp = filterName;
		showShifts();
		$('.form').addClass('hidden');
	});
	$('#profile-email-update-submit').click(function(){
        if (!validate( $('#profile-email-form input').val(), 'email' )) {
        	hideMessages()
            showClientSideErr('invalid email');
        } else {
            //hideClientSideErr();
			hideMessages()
            var payload = {
                "updateType": "email",
                "local": {
                    "email": $('#profile-email-form input').val(),
                    "password": $('#profile-pwd-form input').val()
                }

            };
            SimpleShifts.api.user.update(payload);
        }
	});
	$('#profile-pwd-update-submit').click(function(){
		if ( !validate( $('#profile-pwd-form input').val() ) ) {
			hideMessages()
			showClientSideErr('invalid password')
		} else {
			//hideClientSideErr();
			hideMessages()
			var payload = {
				"updateType":"pwd",
				"local" : {
					"email" : $('#profile-email-form input').val(),
					"password" : $('#profile-pwd-form input').val()
				}
			};
			SimpleShifts.api.user.update(payload);
		}
	});	
	$('#announcementsSubmit').click(function(){
		var newContent = escape($('#announcements-input').val());
		var contentObj = {
			"name":"hp",
			"html":newContent
		};
		SimpleShifts.api.content.update(contentObj);
	});

	//activate admin mode
	if ($('#body').hasClass('loggedIn')) {
		activateAdminMode();	
	}
});