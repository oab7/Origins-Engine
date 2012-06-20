var screenCollection = [];
var fps = 60;
var topZIndex = 10;
var bottomZIndex = 9;
var transZIndex = 11; //this zIndex is used to place emerging layers on top
var dialogueZIndex = 12;

//If there is not a console then make console.log an empty function
//Consider a boolean to force console.log to be an empty statement
//This would be useful to speed up production code runtimes
try{
	console;
} catch(e) {
	console = {};
	console.log = function(){};
}

onLoad = function(){
	
	//setup some of the external css for the dialogueScreen
	var rule = helper.findCSSRule('.dialogue');
	rule.style.width = parseInt($('#origins').css('width')) - 20 + 'px';
	rule.style.height = parseInt($('#origins').css('height'))  / 4 + 'px';
	
	/*
	 * Loading scripts this way is ok for production but not for developement
	 * as all files imported this way don't appear in the debugger
	 */
	/*
	var importer = ["<script type='text/javascript' src='klass.min.js'></script>",
					"<script type='text/javascript' src='Screen.js'></script>",
					"<script type='text/javascript' src='Sprite.js'></script>",
					"<script type='text/javascript' src='input.js'></script>",
					"<script type='text/javascript' src='DialogueScreen.js'></script>"].join("\n");
	
	$('head').append(importer);
	*/
	
	var mainScreen = new Screen('mainScreen', topZIndex);
	//var otherScreen = new Screen('otherScreen', bottomZIndex);
	mainScreen.addSprite(new Sprite(0, 0, 'Sprites/Background.png', 'background'));
	mainScreen.addSprite(new Sprite(999, 0, 'Sprites/Bed.png', 'sleeps'));
	mainScreen.addSprite(new Sprite(199, 99, 'Sprites/Water.png', 'water'));
	mainScreen.addSprite(new Sprite(799, 0, 'Sprites/bike.png', 'bike'));
	mainScreen.addSprite(new Sprite(699, 0, 'Sprites/Ladder.png', 'ladder'));
	mainScreen.addSprite(new Sprite(99, 99, 'Sprites/Food Pellets.png', 'food'))
	mainScreen.addSprite(new Sprite(0, 349, 'Sprites/Drawer.png', 'bookshelf'));
	mainScreen.addSprite(new Sprite(349, 249, 'Sprites/Table.png', 'table'));
	
	//otherScreen.addSprite(new Sprite(0, 0, 'purplecircle.png', 'purplecircle'));
	//otherScreen.addSprite(new screenChangeSprite(368, 184, 'crate.png', 'goRight', mainScreen));
	
	
	//var talkScreen = new DialogueScreen('talkScreen', dialogueZIndex, 'IntroDial.xml');
	//talkScreen.activeScreen = true;
	//helper.ajaxGet(talkScreen);
	
	//screenCollection.push(mainScreen, otherScreen, talkScreen);
	screenCollection.push(mainScreen);
	startGame(60);
}

startGame = function() {
	setInterval(RunGame, 1000 / fps);
}

RunGame = function(){
	for (x in screenCollection){
		screenCollection[x].update();
	}
	for (x in screenCollection){
		screenCollection[x].draw();
	}
}
