//favorite locations of my neighborhood

var LocationData = [
    {
        name : 'Newark City Hall',
        lat : 40.7320459,
        lng :  -74.1732778,
        id : 1,
        list : true,
        description : 'Newark City Hall'
    },
    {
        name : 'New Jersey Performing Arts Center',
        lat : 40.7403235,
        lng : -74.1662554,
        id : 2,
        list : true,
        description : 'New Jersey Performing Arts Center'
    },
    {
        name : 'Newark Penn Station',
        lat : 40.7340,
        lng : -74.1645,
        id : 3,
        list : true,
        description : 'Newark Penn Station'
    },
    {
        name : 'Branch Brook Park',
        lat : 40.7703786,
        lng : -74.1760557,
        id : 4,
        list : true,
        description : 'Branch Brook Park'
    },
    {
        name : 'Cathedral Basilica of the Sacred Heart',
        lat : 40.735657,
        lng : -74.172363,
        id : 5,
        list : true,
        description : 'Cathedral Basilica of the Sacred Heart'
    },
    {
        name : 'Newark Public Schools',
        lat : 40.737868,
        lng : -74.171044,
        id : 6,
        list : true,
        description : 'Newark Public Schools'
    },
    {
        name : 'Newark Airport',
        lat : 40.6925,
        lng : -74.1686,
        id : 7,
        list : true,
        description : 'Newark Airport'
    },
    {
        name : 'Rutgers University–Newark',
        lat : 40.7410,
        lng : -74.1740,
        id : 8,
        list : true,
        description : 'Rutgers University–Newark'
    },
    {
        name :'NJIT',
        lat : 40.7420,
        lng : -74.1790,
        id : 9,
        list : true,
        description : 'NJIT'
    },
    {
        name : 'Newark Museum',
        lat : 40.744290,
        lng : -74.1709556,
        id : 10,
        list : true,
        description : 'Newark Museum'
    }
];

var Location = function(data) {
    'use strict'
    this.name = data.name;
    this.lat = data.lat;
    this.lng = data.lng;
    this.id = data.id;
    this.list = ko.observable(data.list);
    this.description = data.description;
};

var ViewModel = function() {
    var self = this;
    //observable array
    self.locationList = ko.observableArray([]);
    LocationData.forEach(function(item) {
        self.locationList.push( new Location(item) );
    });

    self.criteria = ko.observable();
    //Search function
    self.criteria.subscribe( function(criteria) {
        // show location for matching criteria
        ko.utils.arrayForEach(self.locationList(), function(item) {
            if (item.name.toLowerCase().match(criteria.toLowerCase())) {
                item.marker.setMap(self.map);
                item.list(true);
            }
            else {
                item.marker.setMap(null);
                item.list(false);
            }
        });
      });

    // Create observable for the map and infowindow
    self.map = ko.observable();
    self.infoWindow = ko.observable();

    // Setup the map and components
    function initialize() {
    //Initialize Google Map
        var myLatlng = new google.maps.LatLng(40.735657, -74.1723667);
        var mapOptions = {
            zoom: 15,
            center : myLatlng,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        self.map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
        self.infoWindow = new google.maps.InfoWindow();

        loadElements();

        // Search function position
        var input = document.getElementById('search-input');
        var types = document.getElementById('type-selector');
        self.map.controls[google.maps.ControlPosition.TOP_RIGHT].push(input);
        self.map.controls[google.maps.ControlPosition.TOP_RIGHT].push(types);

        // Resize and re-center map
        google.maps.event.addDomListener(window, 'resize', function() {
            var center = self.map.getCenter();
            google.maps.event.trigger(self.map, 'resize');
            self.map.setCenter(center);
        });

        // Resize and adjust the infowindow
        google.maps.event.addDomListener(window, 'resize', function() {
            self.infoWindow.open(self.map);
        });

        // Detect infowindow closure
        google.maps.event.addListener(self.infoWindow,'closeclick',function(){
            $('#location-list').removeClass('location-list-hide');
        });
    }


    // Create infowindow for elements
    function loadElements() {
    // initial marker
    for (var i = 0; i < self.locationList().length; i++) {
            var content = markerContent(self.locationList()[i]);
            // Use latLng on locations
            var position = new google.maps.LatLng(self.locationList()[i].lat, self.locationList()[i].lng);
            self.locationList()[i].latLng = position;

            self.locationList()[i].marker = new google.maps.Marker({
                position: position,
                map: self.map
            });

            // Additional information in the popup window
            google.maps.event.addListener(self.locationList()[i].marker, 'click', (function(thisMarker, i, content) {
                return function() {
                    // Build infowindow
                    self.infoWindow.setContent(content);
                    self.infoWindow.open(self.map, thisMarker);
                    lookupWikiInfo(self.locationList()[i]);
                    self.map.setCenter(thisMarker.getPosition());

                };
            })
            (self.locationList()[i].marker, i, content));
        }
    }

    // Change visibility of all markers
    function changeVisibility(newVisibility) {
        ko.utils.arrayForEach(self.locationList(), function(item) {
                self.criteria('');
                if (newVisibility) {
                    item.marker.setMap(self.map);
                }
                else {
                    item.marker.setMap(null);
                }
                item.list(newVisibility);
        });
    }

    // marker info
    function markerContent(listItem) {
        var container = '<h2>'+listItem.name+'</h2>';
        container += '<h4>Wikipedia Links</h4>';
        container += '<ul id="wiki-list-'+listItem.id+'" class="wiki-list"></ul>';
        // return the string
        return container;
    }

    // wiki links
    function lookupWikiInfo(listItem) {
        var wikiListUl = $('#wiki-list-'+listItem.id);
        // JSONP request with callback
        var wikiURL = 'http://en.wikipedia.org/w/api.php?action=opensearch&search=' + listItem.description + '&format=json&callback=wikiCallback';
        var ajaxSettings = {
            url: wikiURL,
            dataType: 'jsonp',
            success: function(response) {
              var articleList = response[1];
                for (var i = 0; i < articleList.length; i++) {
                    if (i == 4) {
                        clearTimeout(wikiRequestTimeout);
                        return false;
                    }
                    var articleStr = articleList[i];
                    var url = 'http://en.wikipedia.org/wiki/' + articleStr;
                    wikiListUl.append('<li class="wiki-item"><a href="' + url + '" target="_wikiWindow">' + articleStr + '</a></li>');
                }

                // Warning if no wiki page was found
                if (articleList.length === 0) {
                    wikiListUl.append('<li class="wiki-item">No related Wikipedia links were found.</li>');
                }

                // Prevent timeout if successful
                clearTimeout(wikiRequestTimeout);
                self.infoWindow.open(self.map);
            }
        };
        // ajax request
        $.ajax(ajaxSettings)
        .error(function() {
            wikiListUl.append('<li>Wikipedia Links Could not Load!</li>');
        });
    }

        //shows only the selected marker
        self.selectItemFromList = function(item) {
        changeVisibility(false);
        item.marker.setMap(self.map);
        item.list(true);
        google.maps.event.trigger(item.marker, 'click');
    };
    // shows all markers
    self.makeAllVisible = function() {

        changeVisibility(true);

        self.infoWindow.close();
    };
    // initialize ViewModel
    if (typeof google !== 'undefined') {
        google.maps.event.addDomListener(window, 'load', initialize);
    }
    else {
        $('#map-canvas').append('<strong><br>Google Map CONNECTION FAILED. Check your internet connection.<br></strong>');
    }
};
//Bind ViewModel
ko.applyBindings(new ViewModel());