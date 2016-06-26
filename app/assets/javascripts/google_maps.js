var marker;
var handler = Gmaps.build('Google');
var markers = new Array();

// Toma del navegador las coordenadas y llama a una función usePosition que debe ser definida
// en la página que incluye a éste script
function getLocation()
{
    navigator.geolocation.getCurrentPosition(function(position){
            usePosition(position);
        }, function(error) {
                x.innerHTML = "Geolocation is not supported by this browser.";
        });
}

// usePosition es llamada desde getLocation.js
function usePosition(position) {
    $("#latitud").val(position.coords.latitude);
    $("#longitud").val(position.coords.longitude);
    // centro el mapa en la posición que envía el navegador
    handler.map.centerOn([position.coords.latitude, position.coords.longitude]);
}

// crea el mapa con los marcadores que se envían por parámetro
// el zoom se asigna de acuerdo a la página que se esté mostrando
function createMap(jsonMarkers, zoom)
{
    handler.buildMap({ provider: {}, internal: {id: 'map'}}, function(){
        handler.fitMapToBounds();
    });
    
    addJsonMarkers(jsonMarkers, zoom);
    //limitPanning();
}

// limita el paneo del google map a SMA y alrededores
// el mapa debe estar centrado dentro de los límites antes de invocar éste método
function limitPanning()
{
    // NOOOOOOOOOOOOOOOOOOOOOOOO FUNCIONAAAAAAAAAAAAAAAAAAA
    // ARREGLAAAAAAAAAAAAAAARRRRRR
    // bounds, primero latitud y longitud de la esquina NE y después de la SW
    var allowedBounds = new google.maps.LatLngBounds(
         new google.maps.LatLng(-40.111752666854954 , -71.16297483444214), 
         new google.maps.LatLng(-40.17736337407632, -71.47711515426636)
    );
    // centro actual del mapa
    var lastValidCenter = handler.getMap().getCenter();
    
    // listener para cambio de centro
    google.maps.event.addListener(handler.getMap(), 'center_changed', function() {
        if (allowedBounds.contains(handler.getMap().getCenter())) 
        {
            lastValidCenter = handler.getMap().getCenter();
            return; 
        }
        // última posición válida
        handler.getMap().panTo(lastValidCenter);
    });

}

// agrega el listener al mapa para que se muestren los marcadores del mapa visible
// después de un drag o zoom
function addDragListener()
{
    google.maps.event.addListener(handler.getMap(), 'idle', function(event){
        //window.alert(this.getBounds());
        var bounds = this.getBounds();
        var ne = bounds.getNorthEast(); 
        var sw = bounds.getSouthWest();
       
        for(var i = 0; i < markers.length; i++)
        {
            // cada uno de los marcadores actuales
            var auxMarker = markers[i];
            var auxLat = auxMarker.getPosition().lat();
            var auxLng = auxMarker.getPosition().lng();
            
            // si está dentro de las coordenadas, lo asocio al mapa
            // latitudes y longitudes son negativas
            if(auxLat <= ne.lat() && auxLat >= sw.lat() && 
               auxLng <= ne.lng() && auxLng >= sw.lng())
            {
                auxMarker.setMap(handler.getMap());
            } else {
                // si está fuera, le saco la asociación al mapa
                auxMarker.setMap(null);
            }
        }
  });
}

// agrega los marcadores enviados por json al mapa
function addJsonMarkers(jsonMarkers, zoom)
{   
    // recorro el json enviado con los datos de los marcadores, y los agrego al mapa
    $.each(jsonMarkers, function(i, value) 
    {
        var myLatlng = new google.maps.LatLng(value.lat, value.lng);
        var myMarker = new google.maps.Marker({
        position: myLatlng,
        map: handler.getMap()            
        });

        markers.push(myMarker);
    });
               
    centerMap();
    handler.getMap().setZoom(zoom);
}

// centra el mapa en la posición del primer marcador del mapa
function centerMap()
{
     // si hay marcador, centrar el mapa en la posición del marcador
    if(markers != null && markers.length > 0)
    {
        handler.map.centerOn(markers[0].getPosition());
    } else {
        handler.map.centerOn([-40.1552557,-71.3472031]);
    }
}

//funcion que genera un marker en la posicion donde se genero el evento del mouse
function listener()
{
  // listener para agregar un marker. se permite sólo uno
  google.maps.event.addListener(handler.getMap(), 'click', function(event){
      $("#latitud").val(event.latLng.lat());
      $("#longitud").val(event.latLng.lng());
            
      addMarker(event.latLng);
  });
}

// si existe el marker, lo cambia a la nueva posición, si no exite lo crea
function addMarker(location)
{
    if (markers[0] != null)
    {
        markers[0].setPosition(location);
    } else {
        marker = new google.maps.Marker({
            position: location,
            map: handler.getMap()
        });
        markers[0] = marker;
    }
}


// geolocalizar a partir de calle - número
function getGeocodeLocation()
{
    var searchText = $("#street option:selected").text() +" "+ $('#publication_number').val()+" ,San Martín de los Andes";
    
    var geocoder = new google.maps.Geocoder();

    if(!geocoder) geocoder = new GClientGeocoder();

    geocoder.geocode({'address': searchText}, function(results, status) 
    {
        if (status === google.maps.GeocoderStatus.OK) {
            handler.map.centerOn(results[0].geometry.location);
            handler.getMap().setZoom(14);
            addMarker(results[0].geometry.location);
            $("#latitud").val(results[0].geometry.location.lat);
            $("#longitud").val(results[0].geometry.location.lng);
        } else {
          alert('Geocode was not successful for the following reason: ' + status);
        }
  });
}

// geocoder con la latitud y longitud devuelve la dirección
function geocodeLatLng() {
  var geocoder = new google.maps.Geocoder();
  if(!geocoder) geocoder = new GClientGeocoder();
  var infowindow = new google.maps.InfoWindow();
  
  var latlng = {lat: parseFloat($("#latitud").val()), lng: parseFloat( $("#longitud").val())};
     window.alert($("#latitud").val()+" "+$("#longitud").val());
  geocoder.geocode({'location': latlng}, function(results, status) {
    if (status === google.maps.GeocoderStatus.OK) {
      if (results[1]) {
       var pepe = "";
        for(var x = 0; x<results.length; x++)
            {
                pepe = pepe+results[x].toString();
            }
          window.alert(pepe);
        handler.getMap().setZoom(11);
        addMarker(latlng);
        infowindow.setContent(results[1].formatted_address);
        infowindow.open(handler.getMap(), marker);
      } else {
        window.alert('No results found');
      }
    } else {
      window.alert('Geocoder failed due to: ' + status);
    }
  });
}
