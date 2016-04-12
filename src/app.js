var home = localStorage.getItem('home');
var work = localStorage.getItem('work');
var curcard = 0, fetch_error = false;

simply.scrollable(false);

simply.setText({
  title: 'Пробки',
  subtitle: 'Загрузка...',
  body: 'Up/Down - листать карточки\nSelect - обновить текущую карточку'
}, true);

get_traf();

Pebble.addEventListener("showConfiguration", function() {
  var options = encodeURIComponent(JSON.stringify({home:home, work:work}));
  Pebble.openURL('http://nomadic.name/pebble/probki-settings.html' + '#' + options);
});

Pebble.addEventListener("webviewclosed", function(e) {
  if (e.response.charAt(0) == "{" && e.response.slice(-1) == "}" && e.response.length > 5) {
    var options = JSON.parse(decodeURIComponent(e.response));
    if (options.home) {
      home = options.home;
      localStorage.setItem('home', home);
    }
    if (options.work) {
      work = options.work;
      localStorage.setItem('work', work);
    }
  }
});

simply.on('singleClick', function(e) {
  if (e.button === 'up') {
    if (curcard > 0) 
      curcard--;
    else
      curcard = 2;
  }
  if (e.button === 'down') {
    if (curcard < 2) 
      curcard++;
    else
      curcard = 0;
  }
  simply.subtitle('Загрузка...', true);
  if (curcard === 0) get_traf();
  else if (curcard > 0 && work === null && home === null) {
      simply.text({ title: "Маршрут",
               subtitle: "Ошибка",
               body: "Необходимо указать в настройках приложения координаты дома и работы!"
      });
  } else {
      if (curcard === 1) get_route(home, work, "Дом - Работа");
      else if (curcard === 2) get_route(work, home, "Работа - Дом");
  }
});

function get_traf() {
  ajax({ url: 'http://export.yandex.ru/bar/reginfo.xml' }, 
    function(data){
      fetch_error = false;
      var city_title = data.match(/<title>(.*?)<\/title>/);
      city_title = (city_title !== null) ? city_title[1] : "";
      var city_subtitle = data.match(/<level>(.*?)<\/level>/);
      city_subtitle = (city_subtitle !== null) ? city_subtitle[1]+points(city_subtitle[1]) : "";
      var city_body = data.match(/<hint lang="ru">(.*?)<\/hint>/);
      city_body = (city_body !== null) ? city_body[1] : "";
      ajax({ url: 'http://m.yandex.ru' }, function(data){
        data.replace(/<span class="mheader3__locate__text">(.*?)<\/span>/g, 
                   function(match, text){
                        simply.title(text);
                  });
        data.replace(/<span class="informers3__item-num">(\d)/g, 
                   function(match, text){
                        simply.subtitle(text+points(text));
                  });
        if (data.match(/<div class="traffic-icon-forecast__title">/)) {
          var point = [];
          data.replace(/<div class="notifications_type_traffic__icon__text">(\d)/g, 
                   function(match, text){
                        point.push(text);
                    });
          var hours = [];
          data.replace(/<div class="traffic-icon-forecast__hour-inner">(\d{1,2})/g,
                   function(match, text){
                        hours.push(text);
                    });
          var forecast = '';
          for (var i = 0; i < point.length; i++) forecast = forecast + hours[i]+'й час - '+point[i]+' '+points(point[i])+'\n'; 
          simply.body(forecast);
        }
      });
      simply.text({ title: city_title,
               subtitle: city_subtitle,
               body: city_body
             });
    },
    function(error) {
      fetch_error = true;
      simply.subtitle('Ошибка загрузки:');
      simply.body(error);
      return null;
    });
}

function get_route(begin, end, direction) {
  ajax({ url: 'http://www.yandex.ru/map_router/1.x/?rll='+begin+'~'+end+'&output=time&format=json', type: 'json' }, 
    function(data) {
      fetch_error = false;
      var jams = data.properties.RouterRouteMetaData.jamsLevel+points(data.properties.RouterRouteMetaData.jamsLevel) + ' ('+data.properties.RouterRouteMetaData.JamsTime.text+')';
      if (data.properties.RouterRouteMetaData.JamsLength.value > 0) jams = jams + '\nДлина заторов '+data.properties.RouterRouteMetaData.JamsLength.text+' (из '+data.properties.RouterRouteMetaData.Length.text+')';
      simply.text({ title: "Маршрут",
               subtitle: direction,
               body: jams
             });
    },
    function(error) {
      fetch_error = true;
      simply.subtitle('Ошибка загрузки:');
      simply.body(error);
      return null;
    });
}

function points(n) {
   if (n == 1) { return ' балл'; } else if (n > 1 && n < 5) { return ' балла'; } else { return ' баллов'; }
}
