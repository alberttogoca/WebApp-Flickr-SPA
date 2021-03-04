// Código
var htmlString = '';

//URL busqueda
var url = 'https://api.flickr.com/services/rest/?&method=flickr.photos.getContactsPublicPhotos&api_key=' + api_key + '&user_id=' + user_id + '&count=50' + '&format=json&nojsoncallback=1&extras=owner_name,date_upload';
var urlFriends = 'https://api.flickr.com/services/rest?method=flickr.photos.getContactsPublicPhotos' + '&api_key=' + api_key + '&user_id=' + user_id + '&count=50' + '&just_friends=1&extras=owner_name,date_upload&format=json&nojsoncallback=1';

//Muestra todas las fotos al cargar la página
$(document).ready(function start() {

	//Para simplificar el ampliarFoto
	$.fancybox.defaults.arrows = false; 
	$.fancybox.defaults.toolbar = false;
	$.fancybox.defaults.infobar = false;

	//Timeline en español
	$.fn.albeTimeline.languages = { 
		"es-ES": {
			days: ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"],
			months: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"],
			shortMonths: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"],
			msgEmptyContent: "No hay información para mostrar."
		},
	};

	inicio(); //Llamada que devuelve el JSON de la petición
});

//Devuelve el JSON con los datos
function inicio() {
	$.getJSON(url, mostrarFotos);
}
//Para buscar solo amigos y familiares utiliza la urlFriends
function familiaYAmigos() {
	$.getJSON(urlFriends, mostrarFotos);
}


// Muestra las fotos
function mostrarFotos(info) {

	//Limpiamos la pagina si habia fotos antes
	$("#fotos").empty();
	$("#myTimeline").empty();
	var i = 0;

	//Recorre las fotos y las devuelve si no hay fallos
	Promise.all(info.photos.photo.map(async (item, i) => {

		//Variables
		var image = 'https://farm' + item.farm + ".staticflickr.com/" + item.server + '/' + item.id + '_' + item.secret + '_b.jpg'; //Imagen que se ve al ampliar
		var smallImage = 'https://farm' + item.farm + ".staticflickr.com/" + item.server + '/' + item.id + '_' + item.secret + '_n.jpg'; //Imagen que se ve en miniatura
		var fotoId = "foto_" + i; //Id para las fotos
		var username = $(item).attr('username'); //Nombre de usuario
		var nsid = $(item).attr('owner'); //Id para las fotos de un usuario concreto
		var fecha = formatearFecha(new Date($(item).attr('dateupload') * 1000)); //Formateamos la fecha de subida para que se vea bien

		//Llamada para sacar la info del usuario
		var _realname = await $.getJSON('https://api.flickr.com/services/rest?method=flickr.people.getInfo&api_key=' + api_key + '&user_id=' + nsid + '&format=json&nojsoncallback=1');
		
		//Sacas el nombre real de la info del usuario
		var realname = _realname.person.realname && _realname.person.realname._content ? _realname.person.realname._content : 'No tiene nombre real';

		//Ponemos cada foto en el html
		htmlString = '<div id="' + fotoId + '" class="col-lg-3 col-md-4 col-sm-6 col-xs-12"><a data-fancybox="single" href="' + image + '"><img class="img-thumbnail img-responsive" src="' + smallImage + '" style="width: 260px; height: 210px"></a><h5><a href="#" onclick=fotosUser("' + nsid + '")>' + username + '</a></h5><h6>' + realname + '</h6>' + fecha + '</div>'; //vista en forma de columnas
		return htmlString;

	})).then(data => {
		
		//Añadimos el html a la seccion fotos del index 
		$("#fotos").append(data);
	});
}


//Aqui obtienes la info del usuario y se la pasas a mostrarFotosUser
function fotosUser(nsid, year) {
	var newurl = 'https://api.flickr.com/services/rest/?&method=flickr.photos.search&api_key=' + api_key + '&user_id=' + nsid + '&format=json&nojsoncallback=1&extras=owner_name,date_upload';
	$.getJSON(newurl, (info) => mostrarFotosUser(info, year, nsid));

}

//Muestra las fotos del Usuario en timeline
function mostrarFotosUser(info, year, nsidActual) {

    //Limpiamos la pagina si habia fotos antes
	$("#fotos").empty();

	//Obtenemos el anio actual 
	year = year || new Date().getFullYear();
	var siguiente = year === new Date().getFullYear() ? year - 1 : year + 1;

	//Recorre las fotos y las devuelve si no hay fallos
	Promise.all(info.photos.photo.filter(item => {

		//Formateamos la fecha para compararla con el anio actual
		var upload = new Date(item.dateupload * 1000);
		return upload.getFullYear() === year;

	}).map(async (item) => {

		//Variables
		var image = 'https://farm' + item.farm + ".staticflickr.com/" + item.server + '/' + item.id + '_' + item.secret + '_b.jpg'; //Imagen que se ve al ampliar
		var smallImage = 'https://farm' + item.farm + ".staticflickr.com/" + item.server + '/' + item.id + '_' + item.secret + '_n.jpg'; //Imagen que se ve en miniatura
		var fecha = formatearFechaPerfil(new Date(item.dateupload * 1000)); //Fecha formateada para albe time
		var username = $(item).attr('ownername'); //Nombre de usuario
		var photo_id = $(item).attr('id'); //Id de la foto

		//Llamada para sacar los comentarios de la foto
		var url = 'https://api.flickr.com/services/rest/?&method=flickr.photos.comments.getList&api_key=' + api_key + '&photo_id=' + photo_id + '&format=json&nojsoncallback=1'; //https://api.flickr.com/services/rest/?&method=flickr.photos.comments.getList&api_key=c78d85fefc375edf0f7458376b92c02c&photo_id=109722179&format=json&nojsoncallback=1
		var _comentarios = await $.getJSON(url);

		//Si no hay comentarios se pone vacío
		var comentarios = _comentarios.comments.comment ? _comentarios.comments.comment : [];

		//Aniadimos el dato al timeline 
		return crearDato(fecha, smallImage, username, image, comentarios); 
	
	})).then(data => {

		if (!data.length) data = [{ time: formatearFechaPerfil(new Date(year, 1, 1)) }];
		
		//Aniadimos las publicaciones al timeline y seleccionamos el idioma de la fecha
		$("#myTimeline").albeTimeline(data, {
			language: 'es-ES',
			formatDate: 'dd MMMM ' 
		});

		//Al pulsar en el anio siguiente se limpia la pagina y se cargan los nuevos datos
		$('#myTimeline #' + siguiente).click(function () {
			$("#myTimeline").empty();
			fotosUser(nsidActual, siguiente);
		});
	});
}

//Creamos cada apartado del timeline con su fecha, nombre, comentarios e imagen y lo aniadimos al timeline
function crearDato(fecha, smallImage, username, image, comentarios) {

	var footerMessage = '<h5>No hay comentarios</h5>';
	if(comentarios.length > 0)
	{
		footerMessage = '<h5>Comentarios</h5><br><ul>' + comentarios.map(comentario => {return `<li>${comentario.authorname}: ${comentario._content}</li>`;})+'</ul>';
	}

	return {
		time: fecha,
		header: username,
		body: [
			{
				tag: 'div class="row justify-content-center"',
				content: '<a data-fancybox="single" href="' + image + '"><img class="img-thumbnail img-responsive" src="' + smallImage + '"></a>',
				
			}
		],
		footer: footerMessage,		
	}
}

//Formateo de fecha para mostrar en inicio
function formatearFecha(fecha) {
	var y = fecha.getFullYear();
	var m = fecha.getMonth() + 1;
	var d = fecha.getDate();
	if (d < 10) {
		d = "0" + d;
	}
	if (m < 10) {
		m = "0" + m;
	}
	return "<p>" + d + "-" + m + "-" + y + "</p>";
}

//Formateo de fecha para pasar al timeline
function formatearFechaPerfil(fecha) {
	var y = fecha.getFullYear();
	var m = fecha.getMonth() + 1;
	var d = fecha.getDate();
	if (d < 10) {
		d = "0" + d;
	}
	if (m < 10) {
		m = "0" + m;
	}
	return y + "-" + m + "-" + d;
}






