var StandardCandlesScreen = Screen.extend(function(id){
  this.gameHeight = 485;
  this.gameWidth = 1280;
  this.mouseHeight = null;
  this.mouseWidth = null;
  this.mouseSource = '';
  this.mouseZIndex = null;
  this.mausCount = 5;
  this.selectorUrl = '';
  this.arachneTargets = [];
  this.intercepting = false;
  this.nextTarget = 0;
  this.baseDist = 100;
  this.targetText = new textBox('targetText', '', 600, 491, '#FFFFFF', 4, '20px');
  this.prevTargetText = new textBox('prevTargetText', '', 600, 564, '#ffffff', 4, '20px');
  this.timeText = new textBox('timeText', 'hello', 600, 637, '#ffffff', 4, '20px');
  this.miceCollected = new textBox('miceCollected', '0', 160, 670, '#00ff00', 4, '20px');   
  this.addSprite(this.targetText);
  this.addSprite(this.prevTargetText);
  this.addSprite(this.timeText);
  this.addSprite(this.miceCollected);
})
  .methods({
    addSprite: function(newSprite){
      if (newSprite.id === 'maus'){
        this.mouseHeight = newSprite.height;
        this.mouseWidth = newSprite.width;
        this.mouseSource = newSprite.image.src;
        this.mouseZIndex = newSprite.zIndex;
        for(var i = 1; i <= this.mausCount; i++){
          var top = Math.floor(Math.random() * (this.gameHeight - this.mouseHeight));
          var left = Math.floor(Math.random() * (this.gameWidth - this.mouseWidth));
          var sprite = new clickMoveableSprite(newSprite.id + i, left, top, this.mouseSource, this.mouseZIndex);
          sprite.scaleTo(i * 0.2);
          sprite.classes.push('maus');
          this.supr(sprite)
        }
      } else if (newSprite.id === 'maus_selector'){
        this.selectorUrl = newSprite.image.src;
      } else {
        this.supr(newSprite);
      }
    },
    resetMice: function(){
      for(id in this.spriteArray){
        if (id.match('maus.')){
          delete this.spriteArray[id];
        }
      }
      for(var i = 1; i <= this.mausCount; i++){
        var top = Math.floor(Math.random() * (this.gameHeight - this.mouseHeight));
        var left = Math.floor(Math.random() * (this.gameWidth - this.mouseWidth));
        var sprite = new clickMoveableSprite('maus' + i, left, top, this.mouseSource, this.mouseZIndex);
        sprite.scaleTo(i * 0.2);
        sprite.classes.push('maus');
        sprite.parent = this;
        this.spriteArray[sprite.id] = sprite;
      }
    },
    update: function(){
      this.supr();
      var that = this;
      if (this.confirmedSprite){
        var confirmed = this.confirmedSprite;
        if(confirmed instanceof moveableSprite){
          if ((function(){
            for(target in that.arachneTargets){
              if (confirmed.id === that.arachneTargets[target].maus) return false;
            }
            return true;
          })()){
          //if (this.arachneTargets.indexOf(confirmed.id) == -1){
            var x = Math.floor((confirmed.width - (confirmed.width * confirmed.scale)) / 2);
            var x = confirmed.left - x;
            var y = Math.floor((confirmed.height - (confirmed.height * confirmed.scale)) / 2);
            var y = confirmed.top - y;
            this.prevTargetText.text = this.targetText.text;
            this.targetText.text = Math.floor(this.baseDist / confirmed.scale) + 'k';
            var sprite = new moveableSprite(
              confirmed.id + 'selector',
              x, y,
              this.selectorUrl,
              confirmed.zIndex);
            sprite.classes.push('maus_selector');
            this.arachneTargets.push({x: x, y: y, id: sprite.id, maus: confirmed.id, dist: this.targetText.text});
            this.addSprite(sprite);
          }
        } else if (confirmed.id === 'intercept_button' && !this.intercepting){
          //check to see if the selection array is in the correct order
          var that = this;
          if ((function() {
            if (that.arachneTargets.length != that.mausCount) return false; 
            var prev = 0;
            for(target in that.arachneTargets){
              target = that.arachneTargets[target];
              if (prev == 0) prev = parseInt(target.dist);
              else if (parseInt(target.dist) > prev) prev = parseInt(target.dist);
              else return false;
            }
            return true;
          })()){
            this.spriteArray['arachne_icon'].moveTo(this.arachneTargets[this.nextTarget].x, this.arachneTargets[this.nextTarget].y, 1);
            this.nextTarget++;
            this.intercepting = true;
          } 
          //if the array wasn't in order than clear all selectors
          else {
            for(target in this.arachneTargets){
              delete this.spriteArray[this.arachneTargets[target].id];
            }
            this.arachneTargets = [];
            this.targetText.text = '';
            this.prevTargetText.text = '';
          }

        } else if (confirmed.id === 'undo_button' && !this.intercepting){
          var target = this.arachneTargets[this.arachneTargets.length - 1];
          delete this.spriteArray[target.id];
          if (this.arachneTargets.length > 1){
            this.targetText.text = this.arachneTargets[this.arachneTargets.length - 2].dist;
            if (this.arachneTargets.length > 2){
              this.prevTargetText.text = this.arachneTargets[this.arachneTargets.length - 3].dist;
            } else {
              this.prevTargetText.text = '';
            }
          } else {
            this.targetText.text = '';
          }
          this.arachneTargets.splice(this.arachneTargets.length - 1, 1);
        }
      }
      //keep arachne moving if she has stopped and collected a mouse
      if (this.intercepting && !this.spriteArray['arachne_icon'].moving) {
        this.miceCollected.text = parseInt(this.miceCollected.text) + 1;
        delete this.spriteArray[this.arachneTargets[this.nextTarget - 1].maus];
        delete this.spriteArray[this.arachneTargets[this.nextTarget - 1].id];
        if (this.nextTarget < this.arachneTargets.length) {
          this.spriteArray['arachne_icon'].moveTo(this.arachneTargets[this.nextTarget].x, this.arachneTargets[this.nextTarget].y, 1);
          this.nextTarget++;
        } else {
          this.spriteArray['arachne_icon'].moveToOrigin(1);
          this.selectedArray = [];
          this.arachneTargets = [];
          this.targetText.text = '';
          this.prevTargetText.text = '';
          this.resetMice();
          this.nextTarget = 0;
          this.intercepting = false;
        }
      }
    }
  })
