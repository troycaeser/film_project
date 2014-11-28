$(document).ready(function() {
	//code that depends on result

	var s,
		TmdbSearch = {
			//elements
			el:{
				searchFieldCollection: $('#collection'),
				searchFieldMovie: $('#movie'),
				tab: $('.tab'),
				tab_nav: $('.tab_nav')
			},
			//basic settings
			settings: {
				url: 'http://api.themoviedb.org/3/',
				imageUrl: 'http://image.tmdb.org/t/p/w300',
				mode: ['search/collection', 'collection', 'search/movie', 'movie'],
				query: '&query=',
				key: '?api_key=7bffe4fa3e178f55e7f2552625bcc4a3',
				button: $('#buttons'),
				autoOp: '&search_type=ngram',
				initialTime: [],
				stackResults: [], //<!-- this is basically all the results
				localResults: []
			},

			//init function
			init: function() {
				s = this.settings;
				this.bindUIActions();
				this.readLocal();
			},

			//read local storage
			readLocal: function(){
				//get and prepare local data
				var local = localStorage.getItem('local'),
					results = JSON.parse(local);

				//save to localStorage
				var arrResult = TmdbSearch.settings.localResults;

				$.each(results, function(index, value){
					arrResult.push(value);
				});

				localStorage.setItem('local', JSON.stringify(results));

				//get total time and insert images
				var time = 0;
				for(var i in results){
					time = time + results[i].runtime;
					TmdbSearch.insertImage(results[i].poster, results[i].title);

					var last_result = results.length - 1;

					//populate stuffers, then make sure its all loaded.
					$('.bd_stuffer').attr('src', results[last_result].backdrop).load(function() {
						$('.imgStuff').css('background-image', 'url(' + results[last_result].backdrop + ')');
						$(this).attr('src', 'null'); //empties buffer
					});
				}

				// console.log(time);
				TmdbSearch.calculateTime(time);

				//save local time
				TmdbSearch.settings.initialTime.push(time);
				// console.log(TmdbSearch.settings.initialTime);

			},

			//UI BINDING
			bindUIActions: function(){

				//bind autocomplete with searchCollection
				TmdbSearch.el.searchFieldCollection.autocomplete({
					minLength	: 3,
					source		: function(request, response){
						TmdbSearch.searchCollection(request.term, response, TmdbSearch.searchCollectionId);
						TmdbSearch.settings.stackResults = [];
					},
					select		: TmdbSearch.imageTimeHandler,
					open		: TmdbSearch.blurEffect,
					close		: TmdbSearch.blurEffectClose
				})
				.autocomplete( "instance" )._renderMenu = TmdbSearch.autoRenderMenu;

				//bind autocomplete with searchMovie
				TmdbSearch.el.searchFieldMovie.autocomplete({
					minLength	: 2,
					source		: function(request, response){
						TmdbSearch.searchMovie(request.term, response, TmdbSearch.searchMovieTime);
						TmdbSearch.settings.stackResults = [];
					},
					select		: TmdbSearch.imageTimeHandler,
					open		: TmdbSearch.blurEffect,
					close		: TmdbSearch.blurEffectClose
				})
				.autocomplete( "instance" )._renderMenu = TmdbSearch.autoRenderMenu;

				//bind tabs for navigation
				TmdbSearch.el.tab_nav.on("click", TmdbSearch.tabHandler);

				//bind searchFields for helper texts
				TmdbSearch.el.searchFieldCollection.keyup(TmdbSearch.autoHint);
				TmdbSearch.el.searchFieldMovie.keyup(TmdbSearch.autoHint);
			},

			autoHint: function(event){
				var value = $.trim( this.value ),
					length = value.length,
					thisElem = $(this);

				if(length > 2){
					thisElem.parent().addClass('active');
				}
				else{
					thisElem.parent().removeClass('active');
				}
			},

			tabHandler: function(){
				//find all tabs, remove .tab-current, then add the one clicked on
				TmdbSearch.el.tab.find('ul li').removeClass('tab-current');
				$(this).parent().addClass('tab-current');

				//get role from html - tabs
				var category = $(this).parent().attr('role');

				//get role from html - inputs
				var input = $('.tab_content').attr('role');

				switch(category){
					case "collection":
						$('#section-bar-movie').removeClass('current');
						$('#section-bar-collection').addClass('current');
						break;
					case "movie":
						$('#section-bar-collection').removeClass('current');
						$('#section-bar-movie').addClass('current');
						break;
					case "actor":
						console.log('this is actor');
						break;
				}
			},

			imageTimeHandler: function(event, ui){
				//removes hint
				TmdbSearch.el.searchFieldCollection.parent().removeClass('active');
				TmdbSearch.el.searchFieldMovie.parent().removeClass('active');

				var image_path = ui.item.path,
					poster_path = ui.item.pt_path,
					searchID = ui.item.id,
					searchCategory = ui.item.category,
					title = ui.item.value,
					runTime = 0,
					localLength = $('.movielist').children().length + 1;

				//call insert image function
				TmdbSearch.insertImage(poster_path, title);

				//This filters the stackResults, and returns everything with only the same id.
				var filt_result = $.grep(TmdbSearch.settings.stackResults, function(item){
						return item.id == searchID;
					});

				//This filters filt_result so that it returns things with the category of TIME
				var filt_time = $.grep(filt_result, function(item){
						return item.category == "TIME";
					});

				//loop through the time array and get the collection runTime
				for(var i in filt_time){
					runTime += filt_time[i].time;
				}

				TmdbSearch.settings.initialTime.push(runTime);

				//now loop through initialTime array to get correct time
				var time_result = TmdbSearch.settings.initialTime,
					totalTime = 0;

				for(var i in time_result){
					totalTime += time_result[i]
				}

				// //define local variables
				var obj = {
						local_id: localLength,
						runtime: runTime,
						backdrop: image_path,
						poster: poster_path,
						obj_id: searchID,
						category: searchCategory,
						title: title
					};

				//save to localResults
				TmdbSearch.settings.localResults.push(obj);

				//save to localStorage
				var results = TmdbSearch.settings.localResults;
				console.log(results);
				localStorage.setItem('local', JSON.stringify(results));

				TmdbSearch.calculateTime(totalTime);
				// console.log(totalTime);

				//populate stuffers, then make sure its all loaded.
				$('.bd_stuffer').attr('src', image_path).load(function() {
					$('.imgStuff').css('background-image', 'url(' + image_path + ')');
					$(this).attr('src', 'null'); //empties buffer
				});
			},

			calculateTime: function(totalTime){
				//calculate time
				var hours = Math.floor( totalTime / 60),
					minutes = totalTime % 60;

				//animate time
				jQuery({ Counter: 0, Counter2: 0 }).animate({ Counter: hours, Counter2: minutes }, {
					duration: 1000,
					step: function () {
						$('#hours').text(Math.ceil(this.Counter));
						$('#minutes').text(Math.ceil(this.Counter2));
					}
				});
			},

			insertImage: function(poster_path, title){
				var item_null = $('<span class="movieItem_null">' + title + '</span>').css('display', 'flex').hide().fadeIn(300),
					item = $('<img class="movieItem" src="' + poster_path + '" />').css('display', 'flex').hide().fadeIn(300),
					helper = $('<span class="helper">' + title + '</span>').hide().fadeIn(300);
				if(poster_path == null){
					$('.movielist').prepend(
						$('<li>').prepend(item_null)
					);
				}else{
					$('.movielist').prepend(
						$('<li>').prepend(item).prepend(helper)
					);
				}
			},

			blurEffect: function(){
				$('.movielist').addClass('blur');
			},

			blurEffectClose: function(){
				$('.movielist').removeClass('blur');
			},

			//AUTOCOMPLETE RENDER
			autoRenderMenu: function(ul, items){
				var that = this,
					currentCategory = "";

				$.each( items, function( index, item ) {
					var li;

					that._renderItemData = TmdbSearch.autoRender(ul, item).data("ui-autocomplete-item", item);
				});
			},

			autoRender: function(ul, item){
				switch(item.category) {
					case "COLLECTIONS":
						return $("<li class='autolist'>")
						.append("<a>" + item.value + "</a>")
						.appendTo(ul);
						break;
					case "PARTS":
						return $("<li>")
						.append("<a>" + item.value + "</a>")
						.appendTo(ul);
					case "MOVIES":
						var year = item.year;
						if(year.length == 0){
							return $("<li class='autolist'>")
							.append("<a>" + item.value + "</a>")
							.appendTo(ul);
						}
						else{
							return $("<li class='autolist'>")
							.append("<a>" + item.value + " (" + item.year + ") " + "</a>")
							.appendTo(ul);
						}
						break;
				}
			},

			//SEARCHES

			//COLLECTIONS
			//this queries the collection via moviename
			searchCollection: function(input, response, callback){
				$.ajax({
					type: 'GET',
					url: s.url + s.mode[0] + s.key + s.query + input,
					dataType: 'json',
					success: function(data) {
						var results = data.results,
							collection_id = [],
							collection_name = [],
							obj,
							imgBdpath,
							imgPtpath,
							imgFullBdpath,
							imgFullPtpath;

						for(var i in results){
							collection_id.push(results[i].id);
							collection_name.push(results[i].name);
							imgBdpath = results[i].backdrop_path;
							imgPtpath = results[i].poster_path;

							//check if backdrop is null
							if(imgBdpath == null){
								imgFullBdpath = null;
							}
							else{
								imgFullBdpath = TmdbSearch.settings.imageUrl + imgBdpath;
							}

							//check if poster is null
							if(imgPtpath == null){
								imgFullPtpath = null;
							}
							else{
								imgFullPtpath = TmdbSearch.settings.imageUrl + imgPtpath;
							}

							obj = {
								id: collection_id[i],
								value: collection_name[i],
								category: "COLLECTIONS",
								path: imgFullBdpath,
								pt_path: imgFullPtpath,
								time: 0 //<!-- will be edited later
							};
							TmdbSearch.settings.stackResults.push(obj);
							response(TmdbSearch.settings.stackResults);

							// this makes sure that the collection movie results are here.
							callback(collection_id[i], response);
						}
					},
					error: function(e){
						console.log(e.message);
					}
				});
			},

			//this searches via id
			searchCollectionId: function(input, response){
				$.ajax({
					type: 'GET',
					url: s.url + s.mode[1] + "/" + input + s.key + s.autoOp,
					dataType: 'json',
					success: function(data) {
						var parts = data.parts,
							part_title = [],
							part_id = [],
							obj,
							imgBdpath,
							imgPtpath,
							imgFullBdpath;

						for(var i in parts){
							part_title.push(parts[i].title);
							part_id.push(parts[i].id);
							imgBdpath = parts[i].backdrop_path;
							imgPtpath = parts[i].poster_path;

							//check if backdrop is null
							if(imgBdpath == null){
								imgFullBdpath = null;
							}
							else{
								imgFullBdpath = TmdbSearch.settings.imageUrl + imgBdpath;
							}

							//check if poster is null
							if(imgPtpath == null){
								imgFullPtpath = null;
							}
							else{
								imgFullPtpath = TmdbSearch.settings.imageUrl + imgPtpath;
							}

							obj = {
								id: part_id[i],
								category: "PARTS",
								value: part_title[i],
								path: imgFullBdpath,
								pt_path: imgFullPtpath,
								time: 0 //<!-- will be edited later
							};
							// TmdbSearch.settings.stackResults.push(obj);
							TmdbSearch.searchPartsTime(part_id[i]);
							// response(TmdbSearch.settings.stackResults);
						}
						//gotta make sure that links of images are displayed here
					},
					error: function(e) {
						console.log(e.message);
					}
				});
			},

			//search for collection parts time
			searchPartsTime: function(result){
				$.ajax({
					type: 'GET',
					url: s.url + s.mode[3] + "/" + result + s.key,
					dataType: 'json',
					success: function(data) {
						// console.log(data);

						var obj,
							belong_CID,
							total_time;

						belong_CID = data.belongs_to_collection.id;
						total_time = data.runtime;
						// console.log(belong_CID);
						obj = {
							id: belong_CID,
							category: "TIME",
							value: data.title,
							path: null,
							time: total_time //<!-- will be edited later
						};

						TmdbSearch.settings.stackResults.push(obj);

						// console.log(obj);
					},
					error: function(e) {
						console.log(e.message);
					}
				});
			},

			//MOVIES
			searchMovie: function(input, response, callback){
				$.ajax({
					type: 'GET',
					url: s.url + s.mode[2] + s.key + s.query + input,
					dataType: 'json',
					success: function(data) {
						var results = data.results,
							movie_id = [],
							movie_title = [],
							release_date = [],
							obj,
							imgBdpath,
							imgPtpath,
							imgFullBdpath,
							imgFullPtpath;

						for(var i in results){
							movie_id.push(results[i].id);
							movie_title.push(results[i].title);
							release_date.push(results[i].release_date.slice(0, 4));
							imgBdpath = results[i].backdrop_path;
							imgPtpath = results[i].poster_path;

							//check if backdrop is null
							if(imgBdpath == null){
								imgFullBdpath = null;
							}
							else{
								imgFullBdpath = TmdbSearch.settings.imageUrl + imgBdpath;
							}

							//check if poster is null
							if(imgPtpath == null){
								imgFullPtpath = null;
							}
							else{
								imgFullPtpath = TmdbSearch.settings.imageUrl + imgPtpath;
							}

							obj = {
								id: movie_id[i],
								value: movie_title[i],
								category: "MOVIES",
								year: release_date[i],
								path: imgFullBdpath,
								pt_path: imgFullPtpath,
								time: 0 //<!-- will be edited later
							}

							TmdbSearch.settings.stackResults.push(obj);
							response(TmdbSearch.settings.stackResults);

							callback(movie_id[i], response);
						}
					},
					error: function(e){
						console.log(e.message);
					}
				});
			},

			searchMovieTime: function(input, response){
				$.ajax({
					type: 'GET',
					url: s.url + s.mode[3] + "/" + input + s.key,
					dataType: 'json',
					success: function(data) {
						var obj,
							id,
							total_time;

						id = data.id;
						total_time = data.runtime;
						// console.log(belong_CID);
						obj = {
							id: id,
							category: "TIME",
							value: data.title,
							path: null,
							time: total_time //<!-- will be edited later
						};

						TmdbSearch.settings.stackResults.push(obj);
					},
					error: function(e) {
						console.log(e.message);
					}
				});
			}

			
		};

		//initialise TMDBCONNECTION, start search
		TmdbSearch.init();
});