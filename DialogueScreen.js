/*
* While DialogueScreens do have a parent screen they are still contained within
   * the screen collection and their update is handled from their. This is true of
* all screens, hence why DialogueScreen update is not handled by its parent
*/

var DialogueScreen = Screen.extend(function(id, file){
  //Contains the first statement in a dialogue, this will start off the conversation
  this.activeStatement = null;
  this.nextActiveStatement = null;
  this.previousActiveStatement = null;
  this.originalActive = null; //Track the original active so it can be reset on exit
  this.file = file; //url of the xml file with relevant dialogue
  this.set_check = []; //object to contain the set & check conversation values
  this.keyValue = false;
  //These strings contain the HTML values to reuse when the active Statement isn't relevant
  this.overseerHTML = '';
  this.playerHTML = '';
  this.popupHTML = '';
  this.statements = []; //array of all statements
  this.classes = ['dialogueWrapper']; //override the standard screen css class and add a different one
  this.activateBlock = false;
  this.topSprite = new Sprite('topSprite', 0, 0, 'Sprites/Dialogue/top_dialogue.png', 1);
  this.bottomSprite = new Sprite('bottomSprite', 0, 0, 'Sprites/Dialogue/bottom_dialogue.png', 1);
  this.bottomSprite.changeTop(g.origins.height - this.bottomSprite.height);
  this.speakerName = new textBox('speaker', '', 120, 210, '#3399ff', 10, '20px');
  this.spriteArray.push(this.topSprite, this.bottomSprite, this.speakerName);

  if (!helper.findCSSRule('#OverseerDIV')){
    this.overseerRule = helper.addCSSRule('#OverseerDIV', {
      top: '0px', left: '85px', 'z-index': 2, color: '#ffffff'
    });

    //if overseerDialogue wasn't there it is reasonable to assume that the other
    //cssRules aren't there either and should be created
    this.playerRule = helper.addCSSRule('#PlayerDIV', {
      top: g.origins.height - parseInt(helper.findCSSRule('.speech').style.height) - 2 + 'px',
      left: 85 + 'px',
      'z-index': 2,
      color: '#ffffff'
    });

    this.responseRule = helper.addCSSRule('.responseDialogue', {
      width: helper.findCSSRule('.speech').style.width,
      height: Math.floor(parseInt(helper.findCSSRule('.speech').style.height) / 5) + 'px'
    });
  } else {
    this.overseerRule = helper.findCSSRule('#OverseerDIV');
    this.playerRule = helper.findCSSRule('#PlayerDIV');
    this.responseRule = helper.findCSSRule('.responseDialogue');
  }

  this.responseHolders = [];
  for(var i = 0; i < 5; i++){
    this.responseHolders[i] = {};
    this.responseHolders[i].top = parseInt(this.responseRule.style.height) * i + 'px';
  }
})

  .methods({
    //Pass the file name so it can be outputted on error for easy debugging
    loadXML: function(xml, fileName){
      var count = 0;
      /*
       * Object literals for storing dialogue statements
       * These are just for setting up structures 
       */
      var statements = {};
      var that = this;
      
      $(xml).find("overseer").each(function(){
        var id = $(this).attr('id');
        
        if(!statements[id]){
          var overseer = new OverseerStatement(that, this);
          statements[id] = overseer;
          if(!that.activeStatement){
            that.speakerName.text = 'overseer';
            that.activeStatement = overseer;
          }
        } else {
          statements[id].addTextBlock(this);
        }
      });
      
      $(xml).find("player").each(function(){
        var player = new PlayerOptions(that, this);
        statements[player.id] = player;
      });
      
      $(xml).find('popup').each(function(){
        var popup = new PopupStatement(that, this);
        statements[popup.id] = popup
      });
      
      $(xml).find('arachne').each(function(){
        var id = $(this).attr('id');
        
        if(!statements[id]){
          var arachne = new ArachneStatement(that, this);
          statements[id] = arachne;
          if(!that.activeStatement){
            that.activeStatement = arachne;
            that.speakerName.text = 'arachne';
          }
        } else {
          statements[id].addTextBlock(this);
        }
      });
      
      $(xml).find('general').each(function(){
        var id = $(this).attr('id');
        
        if(!statements[id]){
          var general = new GeneralStatement(that, this);
          statements[id] = general;
          if(!that.activeStatement){
            that.activeStatement = general;
            that.speakerName.text = '';
          }
        } else {
          statements[id].addTextBlock(this);
        }
      });
      
      for(i in statements){
        var statement = statements[i];
        if (statement instanceof PlayerOptions){
          for (j in statement.statementArray){
            linkNext(statement.statementArray[j]);
          }
        } else {
          linkNext(statement);
        }
      }
      
      function linkNext(statement){
        var next = statement.nextType;
        if (statement instanceof GeneralStatement){
          if(next === 'popup' || next === 'player'){
            var tester = statements[statement.nextId];
            if (!tester){
              console.log("ERROR: %s tried to access the invalid %s id %s in the file %s", statement.id, next, statement.nextId, fileName);
            } else {
              statement.setNext(tester);
            }
          } else {
            var contState = new ContinueStatement(that);
            if (next === 'exit'){
              contState.setNext(next, statement.nextId);
            } else if (next === 'endMod'){
              contState.setNext(next);
            } else {
              var tester = statements[statement.nextId];
              if (!tester){
                console.log("ERROR: %s tried to access the invalid %s id %s in the file %s", statement.id, next, statement.nextId, fileName);
              } else {
                contState.setNext(next, tester);
              }
            }
            statement.setNext(contState);
          }
        } else {
          if (next === 'exit' || next === 'endMod'){
            statement.setNext('exit');
          } else if (next === 'overseer' || next === 'player' || next === 'popup' || next === 'arachne' || next === 'general'){
            var tester = statements[statement.nextId];
            if (!tester) {
              console.log("ERROR: %s tried to access the invalid %s id %s in the file %s", statement.id, next, statement.nextId, fileName);
            } else {
              statement.setNext(tester);
            }
          } else {
            console.log("ERROR: %s has an invalid nextType of %s in the file %s", statement.id, statement.nextType, fileName);
          }
        }
      }
    },
     
    activate: function(){
      this.activateBlock = true;
      g.activeDialogue = this.id;
      this.css['opacity'] = 1.0;
      this.originalActive = this.activeStatement;
    },
    
    deActivate: function(){
      g.activeDialogue = null;
      this.css['opacity'] = 0.0;
      this.activeStatement = this.originalActive;
    },
    
    update: function(){
      if (g.activeDialogue == this.id && !this.activateBlock) {
        if (g.input.key.press){
          this.keyValue = g.input.key.value;
        } else {
          this.keyValue = false;
        }
        
        if (this.nextActiveStatement){
          this.previousActiceStatement = this.activeStatement;
          this.activeStatement = this.nextActiveStatement;
          if (this.activeStatement instanceof OverseerStatement) this.speakerName.text = 'overseer';
          else if (this.activeStatement instanceof ArachneStatement) this.speakerName.text = 'arachne';
          this.nextActiveStatement = null;
        }
        
        var target = -1;
        var mouse = g.input.mouse;
        mouse.X -= g.origins.left + parseInt(this.playerRule.style.left);
        mouse.Y -= g.origins.top + parseInt(this.playerRule.style.top);
        var hovering = false;
        if((mouse.X > 0) && (mouse.X <= parseInt(helper.findCSSRule('.speech').style.width))
          && (mouse.Y > 0) && (mouse.Y <= parseInt(helper.findCSSRule('.speech').style.height))){
          
          var target = Math.floor(mouse.Y / parseInt(this.responseRule.style.height));
          
          if (mouse.click) {
            this.activeStatement.clicked = target;
          } else {
            for(var i = 0; i < this.responseHolders.length; i++){
              if(target == i){
                hovering = true;
                //this.responseHolders[i]['background-color'] = '#800000';
              } else {
                //delete this.responseHolders[i]['background-color'];
              }
            }
          }
        }
        if (hovering) this.css.cursor = 'pointer';
        else this.css.cursor = 'default';
        /*
        if (target == -1){
          for(i in this.responseHolders){
            delete this.responseHolders[i]['background-color'];
          }
        }
        */ 
        this.activeStatement.update();
      }
      this.activateBlock = false;
    },
    
    draw: function(HTML){
      if(this.id == g.activeDialogue){
        //this.popupHTML = ''; //Value must be reset as popup should only appear when active
        
        //Function to handle creating the PlayerDiv
        var that = this;
        function addToPlayer(inputString) {
          returnString = ['<div id="PlayerDIV" style="'];
          for(x in that.playerCSS){
            returnString.push(x, ':', that.playerCSS[x], '; ');
          }	
          returnString.push('" class="dialogue speech" >');
          if (inputString instanceof Array){
            var iter = 0; //This should never go greater than 3
            if (iter > 3) console.log('Too many input options');
            $(inputString).each(function(){
              returnString.push('<div style="');
              for (x in that.responseHolders[iter]) {
                returnString.push(x, ':', that.responseHolders[iter][x], '; ');
              };
              returnString.push('" >');
              //allow for both statements and regular strings being passed to this function
              if (this.draw){
                this.draw(returnString);
              } else {
                returnString.push(this);
              }
              returnString.push('</div>');
              iter++;
            });
            returnString.push('</div>');
          } else {
            returnString.push('<div style="');
            for (x in that.responseHolders[0]) {
              returnString.push(x, ':', that.responseHolders[0][x], '; ');
            };
            returnString.push('" >', inputString, '</div></div>');
          }
          return returnString.join('');
        };
        
        //When the overseerDiv needs to be updated
        if (this.activeStatement instanceof GeneralStatement){
          this.overseerHTML = this.activeStatement.stateDraw();
        } else if (this.activeStatement instanceof PlayerOptions ||
        this.activeStatement instanceof PopupStatement ||
        this.activeStatement instanceof ContinueStatement){
          this.playerHTML = this.activeStatement.stateDraw(this.responseHolders);
        } 
        HTML.push('<div id =', this.id, 'Dialouge', ' style="');
        for(x in this.css){
          HTML.push(x, ':', this.css[x], '; ');
        }
        HTML.push('" class="');
        for(x in this.classes){
          HTML.push(this.classes[x], ' ');
        }
        HTML.push('">', this.overseerHTML, this.playerHTML);
        for(i in this.spriteArray){
          this.spriteArray[i].draw(HTML);
        }
        HTML.push('</div>');
      }
    }
  });

var Statement = klass(function(parent, xmlData){
  this.parent = parent;
  this.nextType = $(xmlData).attr('nextType');
  this.nextId = $(xmlData).attr('nextId');
  this.textBlocks = []; //Holder for the different options that can be displayed by this statement
  this.block = 0; //Index for which textBlock to display
  this.clicked = -1;
  
  var that = this;
  var texts = [];
  $(xmlData).find('text').each(function(){
    texts.push(this);
  });
  this.textBlocks.push(new xmlTextBox(texts));
})
  .methods({
    setNext: function(nextStatement){
      this.nextStatement = nextStatement;
    },
    //add text to specified text block, if no block specified then default to the current one
    addText: function(text, block){
      if (!block){
        block = this.block;
      }
      this.textBlocks[block].push(text);
    },
    //add a new textBlock to textBlocks
    addTextBlock: function(xml){
      var texts = [];
      $(xml).find('text').each(function(){
        texts.push(this);
      });
      this.textBlocks.push(texts);
    },
    returnText: function(){
      return this.textBlocks[this.block].draw();
    },
    update: function(){
      if(this.futureBlock){
        this.block = this.futureBlock;
        delete this.futureBlock;
      }
      if (this.block >= this.textBlocks.length){
        if (this.loop){
          this.block = 0;
        } else {
          this.block = this.textBlocks.length - 1;
        }
      }
    },
    draw: function(HTML){
      if(this.textBlocks[this.block]){
        HTML.push(this.textBlocks[this.block].draw());
      }
    },
  });

var GeneralStatement = Statement.extend(function(parent, xmlData){
  this.id = $(xmlData).attr('id');
  if ($(xmlData).attr('highlight')){
    this.highlight = $(xmlData).attr('highlight');
  }
  if ($(xmlData).attr('loop')){
    this.loop = true;
  }
  this.face = null;
})
  .methods({
    update: function(){
      this.supr();
      this.textBlocks[this.block].update();
      if (this.finishWrite){
        this.parent.nextActiveStatement = this.nextStatement;
      } else if (this.textBlocks[this.block].finish){
        this.finishWrite = true;
        console.log('finished');
      }else {
        this.textBlocks[this.block].update();
      }
    },
    stateDraw: function(html){
      var HTML = ['<div id="OverseerDIV" style="'];
      /*
      for(x in this.overseerCSS){
        HTML.push(x,':', this.overseerCSS[x], '; ');
      }
      */
      HTML.push('" class="dialogue speech" >');
      if (this.face){
        this.face.draw(HTML);
        HTML.push('<div id="overseerText" style="left: 266px;">');
      }
      if(this.textBlocks[this.block]){
        HTML.push(this.textBlocks[this.block].draw());
      }
      if (this.face){
        HTML.push('</div></div>');
      } else {
        HTML.push('</div>');
      }
      return HTML.join('');
    }
  });

var OverseerStatement = GeneralStatement.extend(function(parent, xmlData){
  this.face = new Sprite('overseerFace', 0, 0, 'Sprites/Dialogue/overseer_portrait.png', 2);
})
  .methods({
  });

/*
 * This is exactly the same as OverseerStament, no diffs at all
 */
var ArachneStatement = OverseerStatement.extend(function(parent, xmlData){
  this.face = new Sprite('arachneFace', 0, 0, 'Sprites/Dialogue/arachne_portrait.png', 2);
})
  .methods({
  });

/*
* This class wraps sets of player statements. Nonplayer statements
* point to this rather than specific player statements
*/
var PlayerOptions = klass(function(parent, xmlData){
  this.parent = parent;
  this.id = $(xmlData).attr('id');
  this.statementArray = [];
  this.availableStatements = null;
  
  var that = this;
  $(xmlData).find('option').each(function(){
    var statement = new PlayerStatement(that.parent, this, that.id + "Statement" + that.statementArray.length);
    that.statementArray.push(statement);
  });
})
  .methods({
    update: function(){
      //make array of available answers
      if (!this.availableStatements){
        this.availableStatements = [];
        for(x in this.statementArray){
          var statement = this.statementArray[x];
          var check = statement.check();
          if (!check || this.parent.set_check[check]){
            this.availableStatements.push(statement);
          }
        }
      }
      for(i in this.availableStatements){
        this.availableStatements[i].update();
      }
      
      if((this.clicked >= 0) && (this.clicked < this.availableStatements.length)){
        
        var selected = this.availableStatements[this.clicked];
        
        if (selected.target){
          //If a target option has been picked then search through all screens for 
          //the sprite with the id of the target and call its trigger method
          for(i in g.screenCollection){
            var sprite = g.screenCollection[i].getSprite(selected.target);
            if(sprite){
              sprite.trigger();
              break;
            }
          }
        }
        if (selected.nextTime){
          this.parent.originalActive = this.parent.statements[selected.nextTime];
        }
        
        if (selected.nextType === 'exit'){
          this.parent.deActivate();
          //if the screen to exit to is not the current active screen then switch it
          if (selected.nextId != g.activeScreen){
            if(g.screenCollection[selected.nextId]){
              g.screenCollection[g.activeScreen].fadingOut(1);
              g.screenCollection[selected.nextId].fadingIn(1);
            } else {
              console.log(selected.nextId + ' is not a screen in the screen collection');
            }
          }
        } else if (selected.nextType === 'popup'){
          this.parent.nextActiveStatement = selected.nextStatement;
        } else if (selected.nextType === 'endMod'){
          this.parent.deActivate();
          g.screenCollection[g.activeScreen].fadingOut(1);
          g.endMod = true;
        } else {
          this.parent.nextActiveStatement = selected.nextStatement;
          var set = selected.set();
          //if the selected statement has a set variable, set it for later
          if (set){
            this.parent.set_check[set] = true;
          }
        }
        this.clicked = -1;
      }
    },
    stateDraw: function(responseHolders){
      var HTML = ['<div id="PlayerDIV" style="'];
      /*
      for(x in that.playerCSS){
        HTML.push(x, ':', that.playerCSS[x], '; ');
      }	
      */
      HTML.push('" class="dialogue speech" >');
      for(i in this.availableStatements){
        var state = this.availableStatements[i];
        HTML.push('<div style="');
        for (x in responseHolders[i]) {
          HTML.push(x, ':', responseHolders[i][x], '; ');
        };
        HTML.push('" >');
        //allow for both statements and regular strings being passed to this function
        state.draw(HTML);
        HTML.push('</div>');
      }
      HTML.push('</div>');
      return HTML.join('');
    }
  });

/*
* NOTE: parent is a DialogueScreen not a PlayerOptions object
*/
var PlayerStatement = Statement.extend(function(parent, xmlData, id){
  this.id = id; //id is included as a seperate parameter since there is not id definition in the xml
  this.set_check = {}; //optional, object containing id and whether or not this statement uses set or check
  this.target = null;
  var that = this;
  if ($(xmlData).attr('set')){
    that.set_check.set = $(xmlData).attr('set');
  }
  if ($(xmlData).attr('check')){
    that.set_check.check = $(xmlData).attr('check');
  }
  if ($(xmlData).attr('target')){
    that.target = $(xmlData).attr('target');
  }
  if ($(xmlData).attr('nextTime')){
    that.nextTime = $(xmlData).attr('nextTime');
  }
})
  .methods({
    set: function(){
      return this.set_check.set;
    },
    check: function(){
      return this.set_check.check;
    },
    update: function(){
      this.textBlocks[this.block].update();
    }
  });

var PopupStatement = Statement.extend(function(parent, xmlData){
  this.id = $(xmlData).attr('id');
  this.target = $(xmlData).attr('target');
  this.collectedInput = '';
  this.popupStatements = [];
  //this.pressEnter = new xmlTextBox('<x>Press Enter when Done</x>');
})
  .methods({
    update: function(){
      if (this.parent.keyValue){
        var keyValue = this.parent.keyValue;
        if (keyValue == 13){
          g.playerInput[this.target] = this.collectedInput;
          this.parent.nextActiveStatement = this.nextStatement;
        }//Only accept lower or uppercase letters
        else if (((keyValue >= 65) && (keyValue <= 90)) || ((keyValue >= 97) && (keyValue <= 122))){
          this.collectedInput += String.fromCharCode(keyValue);
        } else if (keyValue == 8){
          this.collectedInput = this.collectedInput.slice(0, this.collectedInput.length - 1);
        }
      }
      this.textBlocks[this.block].update();
      //this.pressEnter.update();
    },
    stateDraw: function(responseHolders){
      var HTML = ['<div id="PlayerDIV" style="'];
      var statements = [this.textBlocks[this.block].draw(),
              this.collectedInput,
              //this.pressEnter.draw()];
              'Press Enter when Done'];
      /*
      for(x in that.playerCSS){
        HTML.push(x, ':', that.playerCSS[x], '; ');
      }	
      */
      HTML.push('" class="dialogue speech" >');
      for(i in statements){
        var state = statements[i];
        HTML.push('<div style="');
        for (x in responseHolders[i]) {
          HTML.push(x, ':', responseHolders[i][x], '; ');
        };
        HTML.push('" >', state, '</div>');
      }
      HTML.push('</div>');
      return HTML.join('');
    }
  });

var ContinueStatement = klass(function(parent){
  this.parent = parent;
  this.outputString = 'Press here to continue';
})
  .methods({
    setNext: function(type, next){
      this.nextType = type;
      if (type === 'exit') this.nextId = next;
      else this.nextStatement = next;
    },
    update: function(){
      switch (this.nextType){
        case 'overseer':
        case 'arachne':
        case 'general':
          if (this.clicked >= 0){
            this.parent.nextActiveStatement = this.nextStatement;
          }
          this.clicked = -1;
          break;
        case 'exit':
          if (this.clicked >= 0){
            this.parent.deActivate();
            //if the screen to exit to is not the current active screen then switch it
            if (this.nextId != g.activeScreen){
              if(g.screenCollection[this.nextId]){
                g.screenCollection[g.activeScreen].fadingOut(1);
                g.screenCollection[this.nextId].fadingIn(1);
              } else {
                console.log(this.nextId + ' is not a screen in the screen collection');
              }
            }
          }
          this.clicked = -1;
          break;
        case 'endMod':
          this.parent.deActivate();
          g.screenCollection[g.activeScreen].fadingOut(1);
          g.endMod = true;
          break;
        default:
          this.parent.playerDiv.html("ERROR: " + this.id + " has an invalid nextType");
      }
    },

    stateDraw: function(responseHolders){
      var HTML = ['<div id="PlayerDIV" style="" class="dialogue speech" >'];
      HTML.push('<div style="');
      for(x in responseHolders[0]){
        HTML.push(x, ':', responseHolders[0][x], '; ');
      }
      HTML.push('" >Click here to continue</div></div>');
      return HTML.join('');
    }
  });
