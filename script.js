var canvasEl = $("#canvas")[0],
    canvas = canvasEl.getContext("2d"),
    levels = [];
    defenses = [],
    user = new User(),
    userLocation = new Location(),
    userWeather = new Weather(),
    currentLevel = createLevels(), 
    gameOver = false,
    anim = null,
    animWeather = null,
    currentDrag = null,
    previousTime = "wait",
    enemies = [],
    selected = false,
    snowArray = [],
    currentBackground = 0,
    urls = [];

for(i=0;i<50;i++){
  snowArray.push(new Snow());
}     
         
if(typeof performance === "undefined"){
  performance = {};
  performance.now = function(){
    return Date.now();
  }
}
                          
if("ontouchstart" in window){ 
  document.addEventListener("touchend", clicks);
} else {
  document.addEventListener("click", clicks);
  for(i=0; i<$('.tower').length; i++){
    $('.tower')[i].addEventListener("dragstart", function (e) {
        e.dataTransfer.setData('text', e.target.id);
        currentDrag = e.target.id;
    }, false);
  }

  canvasEl.addEventListener("dragover", function (e) { 
    e.preventDefault(); 
    if(typeof e.offsetX === "undefined"){
      e.offsetX = e.layerX;
      e.offsetY = e.layerY;
    } 
    catchDrag(e);
  }, false);

  canvasEl.addEventListener('drop', function (e) {  
    e.preventDefault();
    if(typeof e.offsetX === "undefined"){
      e.offsetX = e.layerX;
      e.offsetY = e.layerY;
    } 
    catchDrop(e);
  }, false);
}
grabFlickr("texture,water");
drawBackground();

if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    userLocation.get, 
    userLocation.error
  );
}

Number.prototype.between = function (a, b) {
  return this > a && this < b;
};

function $(el){
  return(document.querySelectorAll(el));
}

function clicks(e){
  if(typeof e.offsetX === "undefined"){
    e.offsetX = e.layerX;
    e.offsetY = e.layerY;
  } 
  $('#output')[0].innerHTML = "";
  var tar = e.target.id;
    
  if(tar.substring(0,3) == "lvl"){     
      $('#theme')[0].pause();
      user.reset(tar.substring(3,4));
    } 
  
  if(tar == "background"){
    $('#canvas')[0].style.backgroundImage = "url(" + urls[currentBackground]+ ")";
    $('#canvas')[0].style.backgroundSize = "cover";
    currentBackground++;
    if(currentBackground > 4){
      currentBackground = 0;
    }
  }
  
  if(tar == "play"){
    if(enemies.length == 0){
      user.wave++;
      $('#wave')[0].innerHTML = user.wave;
      enemies = createWaves();
      anim = requestAnimationFrame(gameLoop);
      if($('#soundChoice')[0].checked){
        $('#theme')[0].play();
      }
    } else {
      $('#output')[0].innerHTML = "Can't go to next wave, enemies still alive";
    }
  } else {
    if("ontouchstart" in window){ 
      var clickX = e.changedTouches[0].pageX - canvasEl.offsetLeft;
      var clickY = e.changedTouches[0].pageY - canvasEl.offsetTop;
      
      if(e.target.classList[0] == "tower"){
        currentDrag = e.target.id;
      }
      
      if(e.target.id == "canvas" && currentDrag != null){
        var tower = window[currentDrag]();
        if(droppedOnPath(e.changedTouches[0].pageX-canvasEl.offsetLeft, e.changedTouches[0].pageY-canvasEl.offsetTop, tower.radius)){
          $('#output')[0].innerHTML = "Sorry, that's on the path";
        } else {
          createTower(e.changedTouches[0].pageX-canvasEl.offsetLeft, e.changedTouches[0].pageY-canvasEl.offsetTop, currentDrag);
        }
        currentDrag = null;
      }
      
    } else {
      var clickX = e.offsetX;
      var clickY = e.offsetY;
    }

    
    if(tar == "canvas" && previousTime == "wait"){
      var count = 0;
      for(i=0; i<defenses.length; i++){
        var tower = defenses[i];
        if(clickX.between(tower.x-tower.radius*3, tower.x+tower.radius*3) && clickY.between(tower.y-tower.radius*3, tower.y+tower.radius*3) && selected === i){
          tower.click(e,i,clickY);
          count++;
        } else if(clickX.between(tower.x-tower.radius, tower.x+tower.radius) && clickY.between(tower.y-tower.radius, tower.y+tower.radius)){
          tower.click(e,i,clickY);
          count++;
        } 
      }
      if(count == 0){
        selected = false;
        drawBackground();
      }
    } else if(selected !== false){
      selected = false;
      drawBackground();
    }

    if(gameOver === true){
      $('#gameOver')[0].style.display = "none";
      user.reset(user.level);
      gameOver = false;
    }
  }
}

function Location(){
  this.get = function(position){
    var script = document.createElement("script");
    script.src = "https://api.forecast.io/forecast/a353530f2a3444e552e34f7d70fe8ea1/" + position.coords.latitude + "," + position.coords.longitude + "?callback=userWeather.get";
    document.head.appendChild(script);
  }
  
  this.error = function(e){
    console.log("Could not get your location, see below: ");
    console.log(e);
  }
}

function Weather(){
  this.offset = 0;

  this.get = function(data){
    this.weather = data.currently.icon;
  }
  
  this.draw = function(diff){
    switch(this.weather){
      case "rain":
      case "sleet":
        this.drawRain();
        break;
      case "clear-night":
      case "partly-cloudy-night":
        this.drawNight();
        break;
      case "snow":
        this.drawSnow(diff);
        break;
    }
  }
  
  this.drawRain = function(){
    this.offset++;
    canvas.strokeStyle = "rgba(81,166,221,0.7)";
    canvas.lineWidth = 1;
    var amount = Math.random() * (20 - 5) + 5;
    var d = 500/amount;
    for(x=0; x<amount;x++){
      for(y=0; y<amount; y++){
        canvas.beginPath();
        canvas.moveTo(x*d+this.offset, y*d+this.offset);
        canvas.lineTo(x*d+this.offset+3, y*d+this.offset+3);
        canvas.closePath();
        canvas.stroke();
      }
    }
    if(this.offset>5){
      this.offset = 0;
    }
  }
  
  this.drawNight = function(){
    $('#weatherCanvas')[0].style.background = "rgba(0,0,0,0.5)";
  }
  
  this.drawSnow = function(diff){
    for(i=0;i<snowArray.length;i++){
      snowArray[i].y += snowArray[i].speed/1000 * diff;
      snowArray[i].draw();
      if(snowArray[i].y > 500){
        snowArray[i] = new Snow(0);
      }
    }
  }
  
}

function Snow(y){
  this.x = Math.random() * (500 - 0) + 0;
  if(typeof y === "undefined"){
    this.y = Math.random() * (500 - 0) + 0;
  } else {
    this.y = y;
  }
  
  this.radius = Math.random() * (12 - 5) + 5;
  this.speed = Math.random() * (100 - 50) + 50;
  this.draw = function(){
    canvas.fillStyle = "white";
    canvas.beginPath();
    canvas.arc(this.x,this.y,this.radius,0, Math.PI*2, true);
    canvas.closePath();
    canvas.fill();
  }
}

function User(){
  this.score = 0;  
  this.gold = 500;
  this.level = 0;
  this.wave = 0;
  this.lives = 100;
  this.waveLength = 20000;
  
  this.updateScore = function(change){
    this.score += change;
    $('#score')[0].innerHTML = this.score;
  }
  this.updateGold = function(change){
    this.gold += change;
    $('#gold')[0].innerHTML = this.gold;
  }
  
  this.updateLives = function(change){
    this.lives -= change;
    $('#lives')[0].innerHTML = this.lives;
  }
  
  this.reset = function(lvl){
    cancelAnimationFrame(anim);
    previousTime = "wait";
    enemies = [];
    user = new User();
    $('#score')[0].innerHTML = user.score;
    $('#gold')[0].innerHTML = user.gold;
    $('#wave')[0].innerHTML = user.wave+1;
    $('#lives')[0].innerHTML = user.lives;
    user.level = lvl || 0;
    currentLevel = createLevels();
    defenses = [];
    drawBackground();
  }
  
  this.die = function(){
    cancelAnimationFrame(anim);
    gameOver = true;
    $('#gameOver')[0].style.display = "block";
    $('#finalscore')[0].innerHTML = user.score;
    if(typeof Worker !== "undefined"){
      var myWorker = new Worker("worker.js");
      myWorker.postMessage(canvas.getImageData(0, 0, canvasEl.width, canvasEl.height));
      myWorker.onmessage = function(e){
        canvas.putImageData(e.data, 0, 0);
      }
    } else {
      var d = canvas.getImageData(0, 0, canvasEl.width, canvasEl.height), i, r, g, b, a;
      for(i = 0, l = d.data.length / 4; i < l; i++){
        r = d.data[i * 4];
        g = d.data[i * 4 + 1];
        b = d.data[i * 4 + 2];
        a = d.data[i * 4 + 3];
        r = g = b = Math.floor((r+g+b)/3);
        d.data[i * 4] = r;
        d.data[i * 4 + 1] = g;
        d.data[i * 4 + 2] = b;
      }
      canvas.putImageData(d, 0, 0);
    }
  }
}

function Character(obj){
  this.x = obj.x;
  this.y = obj.y;
  this.radius = obj.radius;
  this.colour = obj.colour;
  this.name = obj.name;
}

function Attacker(obj){
  Character.apply(this, arguments);
  this.dangerColour = obj.dangerColour;
  this.speed = obj.speed;
  this.currentPath = 0;
  this.hp = obj.hp;
  this.value = obj.value;
  this.directionX = "none";
  this.directionY = "none";
  this.draw = function(a,b){
    if(this.hp > 1 && a > 1 && b > 1){
      if(this.hp < 25){
        canvas.fillStyle = this.dangerColour;
      } else {
        canvas.fillStyle = this.colour;
      }
      canvas.fillRect(a-this.radius/2, b-this.radius/2, this.radius, this.radius);
    }
  };
}

function Tower(obj){
  Character.apply(this, arguments);
  this.range = obj.range;
  this.dps = obj.dps;
  this.spellColour = obj.spellColour;
  this.spellTexture = obj.spellTexture;
  this.spellThickness = obj.spellThickness;
  this.spellCap = obj.spellCap;
  this.multitarget = obj.multiTarget;
  this.cost = obj.cost;
  this.sellValue = obj.cost/2;
  this.attackFrom = obj.attackFrom;
  this.currentTarget = "none";
  this.level = 1;
  
  this.draw = function(){
    switch(this.name){
      case "pikachu":
        drawPikachu(this.x, this.y, this.radius);
      break;
      case "squirtle":
        drawSquirtle(this.x, this.y, this.radius);
      break;
      case "bulbasaur":
        drawBulbasaur(this.x, this.y, this.radius);
      break;
      case "charmander":
        drawCharmander(this.x, this.y, this.radius);
      break;
    }
  };
  
  this.click = function(e,num,y){
    if(selected === num) {
      if(y < this.y){
        this.upgrade(); 
        if($('#soundChoice')[0].checked){
          $('#upgrade')[0].play();
        }
      } else {
        this.sell(num);
        if($('#soundChoice')[0].checked){
          $('#sell')[0].play();
        }
      }
    } else {
      selected = num;
      drawBackground();
      this.drawControls();
    }
  }
  
  this.upgrade = function(){
    if(user.gold > this.cost){
      user.updateGold(-this.cost);
      this.cost += Math.round(this.cost/5);
      this.dps += Math.round(this.dps/10) + 2;
      this.sellValue += Math.round(this.cost/2);
      this.level++;
      $('#output')[0].innerHTML = "Current DPS: " + Math.round(this.dps) + " | Upgrade Cost: " + Math.round(this.cost) + " | Sell Value: " + Math.round(this.sellValue);
    } else {
      $('#output')[0].innerHTML = "You can't afford that upgrade";
    }

  }
  
  this.sell = function(i){
    user.updateGold(Math.round(this.sellValue));
    defenses.splice(i,1);
    drawBackground();
  }
  
  this.printInfo = function(){
    $('#output')[0].innerHTML = "Current DPS: " + Math.round(this.dps) + " | Upgrade Cost: " + Math.round(this.cost) + " | Sell Value: " + Math.round(this.sellValue);
  }
  
  this.drawTowerRange = function(x,y){
    canvas.fillStyle = this.colour;
    canvas.beginPath();
    canvas.arc(x,y,this.range,0, Math.PI*2, true);
    canvas.fill();
    canvas.closePath();
  }
  
  this.drawControls = function(){
    this.drawTowerRange(this.x,this.y);
    canvas.beginPath();
    canvas.fillStyle = "rgba(83,191,221,0.6)";
    canvas.arc(this.x,this.y,this.radius*3,Math.PI,2*Math.PI);
    canvas.fill();
    canvas.closePath();

    canvas.beginPath();
    canvas.fillStyle = "rgba(83,191,221,1)";
    canvas.fillRect(this.x-this.radius*0.75,this.y-this.radius*2.3,this.radius*1.5,this.radius*0.5);
    canvas.fillRect(this.x-this.radius*0.25,this.y-this.radius*2.8,this.radius*0.5,this.radius*1.5);
    canvas.fill();
    canvas.closePath();

    canvas.beginPath();
    canvas.fillStyle = "rgba(206,0,43, 0.6)";
    canvas.arc(this.x,this.y,this.radius*3,2*Math.PI,Math.PI);
    canvas.fill();
    canvas.closePath();

    canvas.beginPath();
    canvas.fillStyle = "rgba(206,0,43,1)";
    canvas.fillRect(this.x-this.radius*0.75,this.y+this.radius*1.7,this.radius*1.5,this.radius*0.5);
    canvas.fill();
    canvas.closePath();
    this.draw();
    this.printInfo();
  }
  
  this.shoot = function(targetX, targetY, target, diff){
                             
    if(enemies[target].hp >= 1){
      if(this.currentTarget == "none" || this.currentTarget == enemies[target].name){
        if(this.multitarget == false){
          this.currentTarget = enemies[target].name;
        } 

        var gradient = canvas.createLinearGradient(targetX, targetY, this.x, this.y);
        gradient.addColorStop(0, this.spellColour[0]);
        gradient.addColorStop(1, this.spellColour[1]);
        canvas.strokeStyle = gradient;
        
        if(canvas.setLineDash){
          canvas.setLineDash(this.spellTexture);
        }
        
        canvas.lineWidth = this.spellThickness;
        canvas.lineCap = this.spellCap;
        canvas.beginPath();
        if(this.name == "pikachu" && Math.round(Math.random() * 1) == 0){
          canvas.moveTo(this.x + this.attackFrom[2], this.y + this.attackFrom[3]);
        } else {
          canvas.moveTo(this.x + this.attackFrom[0], this.y + this.attackFrom[1]);
        }
        canvas.lineTo(targetX, targetY);
        canvas.stroke();
        
        var damage = this.dps/1000 * diff;
        enemies[target].hp = enemies[target].hp-damage;      
        
        if(enemies[target].hp < 1){
          user.updateScore(enemies[target].value);
          user.updateGold(enemies[target].value);
          enemies.splice(target,1);
          this.currentTarget = "none";
          for(i=0;i<defenses.length;i++){
            if(defenses[i].currentTarget = target){
              defenses[i].currentTarget = "none";
            }
          }
        }
        
        if(canvas.setLineDash){
          canvas.setLineDash([0]);
        }
      }
    }
  }
}

function pikachu(x,y){
  var obj = {}
  obj.x = x;
  obj.y = y;
  obj.radius = 20;
  obj.colour = "rgba(255, 214, 36, 0.6)";
  obj.name = "pikachu";
  obj.range = 75;
  obj.dps = 10;
  obj.spellColour = ["#ffd624", "#f4ea76"];
  obj.spellTexture = [4,1];
  obj.spellThickness = 2;
  obj.spellCap = "butt";
  obj.multiTarget = true;
  obj.cost = 100;
  obj.attackFrom = [obj.radius/1.8, obj.radius/8, -obj.radius/1.8, obj.radius/8];
  return(new Tower(obj));
}

function squirtle(x,y){
  var obj = {}
  obj.x = x;
  obj.y = y;
  obj.radius = 20;
  obj.colour = "rgba(162, 214, 212, 0.6)";
  obj.name = "squirtle";
  obj.range = 120;
  obj.dps = 20;
  obj.spellColour = ["#a2d6d4", "#76eef4"];
  obj.spellTexture = [2,14];
  obj.spellThickness = 6;
  obj.spellCap = "round";
  obj.multiTarget = false;
  obj.cost = 50;
  obj.attackFrom = [0,obj.radius/3];
  return(new Tower(obj));
}

function bulbasaur(x,y){
  var obj = {}
  obj.x = x;
  obj.y = y;
  obj.radius = 20;
  obj.colour = "rgba(121, 167, 92, 0.6)";
  obj.name = "bulbasaur";
  obj.range = 150;
  obj.dps = 15;
  obj.spellColour = ["#32ac2e", "#21d21c"];
  obj.spellTexture = [1,2];
  obj.spellThickness = 6;
  obj.spellCap = "butt";
  obj.multiTarget = false;
  obj.cost = 50;
  obj.attackFrom = [0,-obj.radius];
  return(new Tower(obj));
}

function charmander(x,y){
  var obj = {}
  obj.x = x;
  obj.y = y;
  obj.radius = 20;
  obj.colour = "rgba(255, 135, 0, 0.6)";
  obj.name = "charmander";
  obj.range = 100;
  obj.dps = 25;
  obj.spellColour = ["#f27c1e","#ffec00"];
  obj.spellTexture = [0];
  obj.spellThickness = 10;
  obj.spellCap = "round";
  obj.multiTarget = false;
  obj.cost = 50;
  obj.attackFrom = [0,obj.radius/2.5];
  return(new Tower(obj));
}

function grabFlickr(search){
  var script = document.createElement('script');
  script.src = "http://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=b965529211ec8cedd0927be13e22d3cc&tags=" + search + "&per_page=5&size=s&format=json";
	document.head.appendChild(script);
}

function jsonFlickrApi(data){
  for(i=0;i<data.photos.photo.length;i++){
    var _this = data.photos.photo[i];
    urls.push("http://farm" + _this.farm + ".staticflickr.com/" + _this.server + "/" + _this.id + "_" + _this.secret + ".jpg");
    var image = new Image();
    image.src = urls[i];
  }
}

function meowth(i, total){
  var obj = {}
  obj.speed = 100;
  var distanceinPixels = (user.waveLength/total)/1000*obj.speed; //2000
  obj.x = currentLevel[0].x-(i*distanceinPixels);
  obj.y = currentLevel[0].y-(i*distanceinPixels);
  obj.radius = 10;
  obj.colour = "#fae6c3";
  obj.dangerColour = "#f00";
  obj.hp = 40;
  obj.name = "Meowth" + i;
  obj.value = 5;
  return(new Attacker(obj));
}

function jesse(i, total){
  var obj = {}
  obj.speed = 80;
  var distanceinPixels = (user.waveLength/total)/1000*obj.speed;//2000
  obj.x = currentLevel[0].x-(i*distanceinPixels);
  obj.y = currentLevel[0].y-(i*distanceinPixels);
  obj.radius = 12;
  obj.colour = "#a51c78";
  obj.dangerColour = "#f00";
  obj.hp = 60;
  obj.name = "Jesse" + i;
  obj.value = 10;
  return(new Attacker(obj));
}

function james(i, total){
  var obj = {}
  obj.speed = 120;
  var distanceinPixels = (user.waveLength/total)/1000*obj.speed; //2000
  obj.x = currentLevel[0].x-(i*distanceinPixels);
  obj.y = currentLevel[0].y-(i*distanceinPixels);
  obj.radius = 16;
  obj.colour = "#8f96ff";
  obj.dangerColour = "#f00";
  obj.hp = 60;
  obj.name = "James" + i;
  obj.value = 10;
  return(new Attacker(obj));
}

function giovanni(i, total){
  var obj = {};
  obj.speed = 140;
  var distanceinPixels = (user.waveLength/total)/1000*obj.speed; //2000
  obj.x = currentLevel[0].x-(i*distanceinPixels);
  obj.y = currentLevel[0].y-(i*distanceinPixels);
  obj.radius = 25;
  obj.colour = "#d4792a";
  obj.dangerColour = "#f00";
  obj.hp = 100;
  obj.name = "Giovanni" + i;
  obj.value = 20;
  return(new Attacker(obj));
}

function drawBackground(){

  canvas.clearRect(0,0, $('#canvas')[0].width, $('#canvas')[0].height);
  canvas.lineJoin = "round";
  canvas.strokeStyle = "#d9f8d8";
  canvas.beginPath();
  canvas.lineWidth = 32;
  for(i=0; i<currentLevel.length; i++){
    canvas.lineTo(currentLevel[i].x, currentLevel[i].y);
  }
  canvas.stroke();
  for(i=0; i<defenses.length; i++){
    defenses[i].draw();
  }
}

function gameLoop(prevTime){ 
  if(typeof previousTime === "undefined" || previousTime == "wait"){
    previousTime = prevTime;
  }
  var diff = performance.now() - previousTime;  
  previousTime = performance.now();
  drawBackground();
 
  
  for(i=0; i<enemies.length; i++){
    if(enemies[i].currentPath < currentLevel.length){
    
      var moveX = enemies[i].speed/1000 * diff;
      var moveY = enemies[i].speed/1000 * diff;
      
      
      if(enemies[i].x <= currentLevel[enemies[i].currentPath].x){
        enemies[i].directionX = true;
        enemies[i].x += moveX;
      } else if(enemies[i].x >= currentLevel[enemies[i].currentPath].x) {
        enemies[i].directionX = false;
        enemies[i].x -= moveX;
      }
      
      if(enemies[i].y <= currentLevel[enemies[i].currentPath].y){
        enemies[i].directionY = true;
        enemies[i].y += moveY;
      } else if(enemies[i].y <= currentLevel[enemies[i].currentPath].y) {
        enemies[i].directionY = false;
        enemies[i].y -= moveY;
      }
      
      if(enemies[i].x >= currentLevel[enemies[i].currentPath].x && enemies[i].y >= currentLevel[enemies[i].currentPath].y){
        if(enemies[i].directionX === true && enemies[i].directionY === true){
          enemies[i].currentPath++;
        }
      } else if(enemies[i].x <= currentLevel[enemies[i].currentPath].x && enemies[i].y <= currentLevel[enemies[i].currentPath].y){
        if(enemies[i].directionX === false && enemies[i].directionY === false){
          enemies[i].currentPath++;
        }
      }
      
      enemies[i].draw(enemies[i].x, enemies[i].y);    

      if(enemies[i].x > 480 || enemies[i].y > 480){
        if(user.lives > 1){
          user.updateLives(enemies[i].value/5);
          if($('#soundChoice')[0].checked){
            $('#loselife')[0].play();
          }
        } else {
          gameOver = true;
        }
        enemies.splice(i,1);          
        clearTarget(i);
      }
      
      for(j=0; j<defenses.length; j++){
        if(enemies[i]){
          if(defenses[j].x + defenses[j].range < enemies[i].x || defenses[j].y + defenses[j].range < enemies[i].y){
            defenses[j].currentTarget = "none";
          }
          if(Math.round(enemies[i].x).between(defenses[j].x-defenses[j].range, defenses[j].x+defenses[j].range) && Math.round(enemies[i].y).between(defenses[j].y-defenses[j].range, defenses[j].y+defenses[j].range)){
            defenses[j].shoot(enemies[i].x, enemies[i].y, i, diff);
          }
        }
      }
    }
  }
  
  if(enemies.length == 0){
    previousTime = "wait";
    drawBackground();
    cancelAnimationFrame(anim);      
    if($('#soundChoice')[0].checked){
      $('#theme')[0].currentTime = 0;
      $('#theme')[0].pause();
      $('#waveOver')[0].play();
    }
    
  } else if(gameOver === true){
    user.die();
  } else {
    if($('#weatherChoice')[0].checked){
      userWeather.draw(diff);
    } else {
      $('#weatherCanvas')[0].style.background = "rgba(0,0,0,0)";
    }
    anim = requestAnimationFrame(gameLoop);
  }
}

function clearTarget(num){
  for(i=0;i<defenses.length;i++){
    if(defenses[i].currentTarget = num){
      defenses[i].currentTarget = "none";
    }
  }
}

function catchDrag(e){
  drawBackground();
  var name = currentDrag;
  var tower = window[name]();
  if(droppedOnPath(e.offsetX, e.offsetY, tower.radius) || user.gold < tower.cost){
    canvas.beginPath();
    canvas.fillStyle = "red";  
    canvas.arc(e.offsetX,e.offsetY,tower.radius,tower.radius, Math.PI*2, true);
    canvas.fill();
    canvas.closePath();
  } else {
    switch(name){
      case "pikachu":
        tower.drawTowerRange(e.offsetX, e.offsetY);
        drawPikachu(e.offsetX, e.offsetY, tower.radius);
      break;
      
      case "squirtle":
        tower.drawTowerRange(e.offsetX, e.offsetY);
        drawSquirtle(e.offsetX, e.offsetY, tower.radius);
      break;
      
      case "bulbasaur":
        tower.drawTowerRange(e.offsetX, e.offsetY);
        drawBulbasaur(e.offsetX, e.offsetY, tower.radius);
      break;
      
      case "charmander":
        tower.drawTowerRange(e.offsetX, e.offsetY);
        drawCharmander(e.offsetX, e.offsetY, tower.radius);
      break;
    }
  }
}

function catchDrop(e){
  drawBackground();
  $('#output')[0].innerHTML = "";
  var tower = window[e.dataTransfer.getData("text")]();
  if(droppedOnPath(e.offsetX, e.offsetY, tower.radius)){
    $('#output')[0].innerHTML = "Sorry, that's on the path";
  } else {    
    createTower(e.pageX-canvasEl.offsetLeft, e.pageY-canvasEl.offsetTop, e.dataTransfer.getData('text'));
  }
}

function droppedOnPath(x,y,r){
  for(i=0; i<levels[user.level].length-1; i++){
    var pathSize = 16 + r,
        x1 = levels[user.level][i].x,
        x2 = levels[user.level][i+1].x,
        y1 = levels[user.level][i].y,
        y2 = levels[user.level][i+1].y;
    
    if(x.between(x1,x2) && y.between(y1-pathSize, y1+pathSize)){
      return true;
    }
    if(y.between(y1,y2) && x.between(x1-pathSize, x1+pathSize)){
      return true;
    }
    
    for(j=1; j<pathSize+r;j++){
      if(((x2+j)-(x1+j))/(y2-y1) == (x-(x1+j))/(y-y1)){
        if(x2 > x && x > x1 && y2 > y && y > y1){
          return true;
        }
      }
      if(((x2-j)-(x1-j))/(y2-y1) == (x-(x1-j))/(y-y1)){
        if(x2 > x && x > x1 && y2 > y && y > y1){
          return true;
        }
      }
    }
  }
  
  for(i=0;i<defenses.length;i++){
    var tower = defenses[i];
    if(x.between(tower.x-tower.radius*2, tower.x+tower.radius*2) && y.between(tower.y-tower.radius*2, tower.y+tower.radius*2)){
      return true;
    }
  }
  
  return false;
}

function createTower(x, y, name){
  defenses.push(window[name](x, y));
  if(user.gold >= defenses[defenses.length-1].cost){
    user.updateGold(-Math.abs(defenses[defenses.length-1].cost));
    if($('#soundChoice')[0].checked){
      $('#' + name + 'Sound')[0].play();
    }
  } else {
    $('#output')[0].innerHTML = "You can't afford that";
    defenses.splice(defenses.length-1, 1);
  }
  defenses[defenses.length-1].draw();
}

function createLevels(){
levels.push([
    {x: 0, y: 0},
    {x: 40, y: 40},
    {x: 460, y: 40},
    {x: 460, y: 110},
    {x: 40, y: 110},
    {x: 40, y: 180},
    {x: 460, y: 180},
    {x: 460, y: 250},
    {x: 40, y: 250},
    {x: 40, y: 320},
    {x: 460, y: 320},
    {x: 460, y: 390},
    {x: 40, y: 390},
    {x: 40, y: 460},
    {x: 460, y: 460},
    {x: $('#canvas')[0].width, y: $('#canvas')[0].height}
  ]);
  levels.push([
    {x: 0, y: 0},
    {x: 40, y: 40},
    {x: 40, y: 80},
    {x: 80, y: 80},
    {x: 80, y: 120},
    {x: 120, y: 120},
    {x: 120, y: 160},
    {x: 160, y: 160},
    {x: 160, y: 200},
    {x: 200, y: 200},
    {x: 200, y: 240},
    {x: 240, y: 240},
    {x: 240, y: 280},
    {x: 280, y: 280},
    {x: 280, y: 320},
    {x: 320, y: 320},
    {x: 320, y: 360},
    {x: 360, y: 360},
    {x: 360, y: 400},
    {x: 400, y: 400},
    {x: 400, y: 440},
    {x: 440, y: 440},
    {x: $('#canvas')[0].width, y: $('#canvas')[0].height}
  ]);
  levels.push([
    {x: 0, y: 0},
    {x: 100, y: 100},
    {x: 100, y: 200},
    {x: 200, y: 200},
    {x: 200, y: 300},
    {x: 300, y: 300},
    {x: 300, y: 400},
    {x: 400, y: 400},
    {x: $('#canvas')[0].width, y: $('#canvas')[0].height}
  ]);
  levels.push([
    {x: 0, y: 0},
    {x: 50, y: 50},
    {x: 50, y: 150},
    {x: 250, y: 150},
    {x: 250, y: 350},
    {x: 350, y: 350},
    {x: $('#canvas')[0].width, y: $('#canvas')[0].height}
  ]);
  levels.push([
    {x: 0, y: 0},
    {x: $('#canvas')[0].width, y: $('#canvas')[0].height}
  ]);
  return levels[user.level];
}

function createWaves(){

  var names = ["meowth", "jesse", "james", "giovanni"];
  var increments = [3,2,2,1];
  var required = [];
  var waves = [];
  
  for(i=1;i<100;i++){
    required.push([10+i*increments[0],8+i*increments[1],8+i*increments[2],5+i*increments[3]]);
  }

  for(i=0;i<required.length;i++){
    var wave = [];
    for(j=0; j<required[i].length; j++){
      for(n=0; n<required[i][j]; n++){
        wave.push(window[names[j]](n, required[i][j]));
      }
    }
    waves.push(wave);
  }
  
  return waves[user.wave];
}

function drawPikachu(x,y,w){
  canvas.lineWidth = 1;
  canvas.strokeStyle = "black";
  canvas.fillStyle = "black";
  
  //black face outline
  canvas.beginPath();
  canvas.arc(x,y,w+2,0, Math.PI*2, true);
  canvas.fill();
  canvas.closePath();
  
  //face
  canvas.beginPath();
  canvas.fillStyle = "#fce503";
  canvas.arc(x, y, w, 0, Math.PI*2, true); 
  canvas.fill();
  

  // eyes
  canvas.fillStyle = "black";
  canvas.beginPath();
  canvas.arc(x-w/3.2,y-w/2.5,w/6, 0, Math.PI*2, true); 
  canvas.arc(x+w/3.2,y-w/2.5,w/6, 0, Math.PI*2, true); 
  canvas.fill();
  canvas.closePath();
  
  //nose
  canvas.beginPath();
  canvas.moveTo(x,y+w/5);
  canvas.lineTo(x-w/16,y+w*0.1);
  canvas.lineTo(x+w/16,y+w*0.1);
  canvas.lineTo(x,y+w/5);
  canvas.fill();
  canvas.stroke();
  canvas.closePath();
  
  //pupils
  canvas.fillStyle = "white";
  canvas.beginPath();
  canvas.arc(x-w*0.35,y-w/2.2,w/15, 0, Math.PI*2, true); 
  canvas.arc(x+w*0.28,y-w/2.2,w/15, 0, Math.PI*2, true); 
  canvas.fill();
  canvas.closePath();

  //cheeks
  canvas.fillStyle = "#f26b4e";
  canvas.beginPath();
  canvas.arc(x-w/1.8,y+w/10,w/5, 0, Math.PI*2, true); 
  canvas.arc(x+w/1.8,y+w/10,w/5, 0, Math.PI*2, true); 
  canvas.fill();
  canvas.closePath();

  //mouth
  canvas.beginPath();   
  canvas.moveTo(x,y+w/2);
  canvas.quadraticCurveTo(x-w/6,y+w*0.7,x-w/3,y+w/2);
  canvas.moveTo(x,y+w/2);
  canvas.quadraticCurveTo(x+w/6,y+w*0.7,x+w/3,y+w/2);
  canvas.stroke();
  canvas.closePath();
}

function drawSquirtle(x,y,w){
  canvas.lineWidth = 1;
  canvas.strokeStyle = "black";
  canvas.fillStyle = "black";
  
  canvas.beginPath();
  canvas.arc(x,y,w+2,0, Math.PI*2, true);
  canvas.fill();
  canvas.closePath();
  
  canvas.beginPath();
  canvas.fillStyle = "#9acccd";
  canvas.arc(x,y,w,0, Math.PI*2, true); 
  canvas.fill();
  canvas.closePath();
  
  canvas.fillStyle = "black";
  
  canvas.beginPath();
  canvas.moveTo(x,y);
  canvas.lineTo(x-w/2.5,y+w/10);
  canvas.lineTo(x-w/1.8,y+w/20);
  canvas.lineTo(x-w,y-w/1.5);
  canvas.lineTo(x,y-w/2.5);
  canvas.lineTo(x+w,y-w/1.5);
  canvas.lineTo(x+w/1.8,y+w/20);
  canvas.lineTo(x+w/2.5,y+w/10);
  canvas.fill();
  canvas.stroke();
  canvas.closePath();
  
  canvas.fillStyle = "#ddd";
  canvas.beginPath();
  canvas.moveTo(x+w/6,y-w/2.2);
  canvas.lineTo(x+w/3,y-w/2);
  canvas.lineTo(x+w/1.8,y+w/15);
  canvas.lineTo(x+w/2.4,y+w/8);
  canvas.fill();
  canvas.closePath();
  
  canvas.beginPath();
  canvas.moveTo(x+w/1.8,y-w/1.8);
  canvas.lineTo(x+w*0.7,y-w/6);
  canvas.lineTo(x+w*0.65,y-w/12);
  canvas.lineTo(x+w/2.2,y-w/1.9);
  canvas.fill();
  canvas.closePath();

  canvas.beginPath();
  canvas.moveTo(x-w/15,y+w/5.5);
  canvas.lineTo(x-w/20,y+w/4.5);
  canvas.moveTo(x+w/15,y+w/5.5);
  canvas.lineTo(x+w/20,y+w/4.5);
  canvas.fill();
  canvas.stroke();
  canvas.closePath();

  canvas.beginPath();
  canvas.moveTo(x-w/2,y+w/3.5);
  canvas.quadraticCurveTo(x-w/3,y+w/2.5,x-w/10,y+w/3);
  canvas.lineTo(x, y+w/2.7);
  canvas.lineTo(x+w/10, y+w/3);
  canvas.quadraticCurveTo(x+w/3,y+w/2.5,x+w/2,y+w/3.5);
  canvas.stroke();
  canvas.closePath();
}

function drawBulbasaur(x,y,w){
  canvas.lineWidth = 1;
  canvas.strokeStyle = "black";
  canvas.fillStyle = "black";
  
  canvas.beginPath();
  canvas.arc(x,y,w+2,0, Math.PI*2, true);
  canvas.fill();
  canvas.closePath();

  canvas.fillStyle = "#6b9d91";
  canvas.beginPath();
  canvas.arc(x, y, w, 0, Math.PI*2, true); 
  canvas.fill();
  canvas.closePath();


  //mouth
  canvas.beginPath();
  canvas.fillStyle = "#c47181";
  canvas.moveTo(x, y+w/1.8);
  canvas.quadraticCurveTo(x+w/1.5,y+w/2.6,x+w/1.5,y+w/5);
  canvas.quadraticCurveTo(x+w/5,y+w/4,x,y+w/3);
  canvas.moveTo(x, y+w/1.8);
  canvas.quadraticCurveTo(x-w/1.5,y+w/2.6,x-w/1.5,y+w/5);
  canvas.quadraticCurveTo(x-w/5,y+w/4,x,y+w/3);
  canvas.fill();
  canvas.closePath();

  //teeth
  canvas.beginPath();
  canvas.fillStyle = "#fff";
  canvas.moveTo(x-w/2, y+w/4.6)
  canvas.lineTo(x-w/2.2,y+w/3.2);
  canvas.lineTo(x-w/2.4,y+w/4.35);
  canvas.moveTo(x+w/2, y+w/4.6)
  canvas.lineTo(x+w/2.2,y+w/3.2);
  canvas.lineTo(x+w/2.4,y+w/4.35);
  canvas.fill();
  canvas.closePath();

  //eyes
  canvas.beginPath();
  canvas.fillStyle = "#fff";
  canvas.moveTo(x-w/5, y-w/20)
  canvas.lineTo(x-w/1.6,y-w/10);
  canvas.quadraticCurveTo(x-w/1.5,y-w/3,x-w/2.4,y-w/2);
  canvas.lineTo(x-w/5,y-w/3);
  canvas.moveTo(x+w/5, y-w/20)
  canvas.lineTo(x+w/1.6,y-w/10);
  canvas.quadraticCurveTo(x+w/1.5,y-w/3,x+w/2.4,y-w/2);
  canvas.lineTo(x+w/5,y-w/3);
  canvas.fill();
  canvas.closePath();

  //markings

  canvas.beginPath();
  canvas.lineJoin = "round";
  canvas.fillStyle = "#1c685e";
  canvas.moveTo(x, y-w/2)
  canvas.lineTo(x-w/10,y-w/1.6);
  canvas.lineTo(x+w/6,y-w/1.2);
  canvas.lineTo(x+w/4,y-w/1.4);
  canvas.closePath();
  canvas.fill();

  canvas.beginPath();
  canvas.moveTo(x-w/8,y-w/2);
  canvas.lineTo(x,y-w/2.5);
  canvas.lineTo(x-w/10,y-w/2.8);
  canvas.lineTo(x-w/7,y-w/2.4);
  canvas.fill();
  canvas.closePath();

  canvas.beginPath();
  canvas.moveTo(x+w/7,y-w/2);
  canvas.lineTo(x+w/6,y-w/2.5);
  canvas.lineTo(x+w/10,y-w/2.8);
  canvas.lineTo(x+w/15,y-w/2.4);
  canvas.fill();
  canvas.closePath();

  //eyes
  canvas.beginPath();
  canvas.fillStyle = "#ac344d";
  canvas.moveTo(x-w/5, y-w/20)
  canvas.lineTo(x-w/2, y-w/12);
  canvas.lineTo(x-w/2.8, y-w/2.2);
  canvas.lineTo(x-w/3.5, y-w/2.5);
  canvas.lineTo(x-w/3.2, y-w/4);
  canvas.lineTo(x-w/3.8, y-w/4.5);
  canvas.lineTo(x-w/4, y-w/2.7);
  canvas.lineTo(x-w/5, y-w/3);
  canvas.closePath();
  canvas.fill();

  canvas.beginPath();
  canvas.fillStyle = "#ac344d";
  canvas.moveTo(x+w/5, y-w/20)
  canvas.lineTo(x+w/2, y-w/12);
  canvas.lineTo(x+w/2.8, y-w/2.2);
  canvas.lineTo(x+w/3.5, y-w/2.5);
  canvas.lineTo(x+w/3.2, y-w/4);
  canvas.lineTo(x+w/3.8, y-w/4.5);
  canvas.lineTo(x+w/4, y-w/2.7);
  canvas.lineTo(x+w/5, y-w/3);
  canvas.closePath();
  canvas.fill();
}

function drawCharmander(x,y,w){
  canvas.lineWidth = 1;
  canvas.strokeStyle = "black";
  canvas.fillStyle = "black";
  
  canvas.beginPath();
  canvas.arc(x,y,w+2,0, Math.PI*2, true);
  canvas.fill();
  canvas.closePath();
  
  canvas.fillStyle = "#fc8503";
  canvas.beginPath();
  canvas.arc(x, y, w, 0, Math.PI*2, true); 
  canvas.fill();
  canvas.closePath();

  //nose
  canvas.beginPath();
  canvas.moveTo(x-w/15,y+w/4);
  canvas.lineTo(x-w/20,y+w/3.5);
  canvas.moveTo(x+w/15,y+w/4);
  canvas.lineTo(x+w/20,y+w/3.5);

  //eyebrows
  canvas.moveTo(x-w/2.5,y-w/1.25);
  canvas.quadraticCurveTo(x-w/5, y-w/1.2 ,x-w/6,y-w/1.5);
  canvas.moveTo(x+w/2.5,y-w/1.25);
  canvas.quadraticCurveTo(x+w/5, y-w/1.2 ,x+w/6,y-w/1.5);

  canvas.fill();
  canvas.stroke();
  canvas.closePath();


  //mouth
  canvas.beginPath();
  canvas.fillStyle = "#9e244d";
  canvas.moveTo(x, y+w/1.4);
  canvas.quadraticCurveTo(x+w/2,y+w/1.8,x+w/1.5,y+w/3);
  canvas.lineTo(x+w/1.8,y+w/2.5);
  canvas.quadraticCurveTo(x+w/5,y+w/2.6,x,y+w/2.3);
  canvas.moveTo(x, y+w/1.4);
  canvas.quadraticCurveTo(x-w/2,y+w/1.8,x-w/1.5,y+w/3);
  canvas.lineTo(x-w/1.8,y+w/2.5);
  canvas.quadraticCurveTo(x-w/5,y+w/2.6,x,y+w/2.3);
  canvas.fill();
  canvas.closePath();

  //tongue
  canvas.beginPath();
  canvas.fillStyle = "#eb749e";
  canvas.moveTo(x-w/2.5, y+w/1.8);
  canvas.quadraticCurveTo(x,y+w/2.2,x+w/2.5, y+w/1.8);
  canvas.quadraticCurveTo(x,y+w/1.3,x, y+w/1.4);
  canvas.quadraticCurveTo(x,y+w/1.3,x-w/2.5, y+w/1.8);
  canvas.fill();
  canvas.closePath();

  // white of eyes
  canvas.beginPath();
  canvas.fillStyle = "#fff";
  canvas.moveTo(x-w/5, y-w/20);
  canvas.bezierCurveTo(x-w/10, y-w*0.9, x-w/1.8, y-w*0.9, x-w/1.7, y-w/8);
  canvas.quadraticCurveTo(x-w/2.2,y,x-w/5, y-w/20);
  canvas.moveTo(x+w/5, y-w/20);
  canvas.bezierCurveTo(x+w/10, y-w*0.9, x+w/1.8, y-w*0.9, x+w/1.7, y-w/8);
  canvas.quadraticCurveTo(x+w/2.2,y,x+w/5, y-w/20);
  canvas.fill();
  canvas.closePath();

  //green of eyes

  canvas.beginPath();
  canvas.fillStyle = "#006634";
  canvas.moveTo(x-w/5.5, y-w/5);
  canvas.bezierCurveTo(x-w/4,y+w/20,x-w/1.4,y+w/20,x-w/1.9,y-w/2);
  canvas.lineTo(x-w/2, y-w/3);
  canvas.lineTo(x-w/5.4, y-w/3);

  canvas.moveTo(x+w/5.5, y-w/5);
  canvas.bezierCurveTo(x+w/4,y+w/20,x+w/1.6,y+w/20,x+w/1.75,y-w/3);
  canvas.lineTo(x+w/1.9, y-w/2);
  canvas.lineTo(x+w/5.4, y-w/3);

  canvas.fill();
  canvas.closePath();

  //black of eyes
  canvas.beginPath();
  canvas.fillStyle = "#000";
  canvas.moveTo(x-w/5.5, y-w/3);
  canvas.bezierCurveTo(x-w/5,y,x-w/1.6,y,x-w/1.9,y-w/2);
  canvas.quadraticCurveTo(x-w/2,y-w/4,x-w/2.5,y-w/2);
  canvas.quadraticCurveTo(x-w/2.5,y-w/1.5,x-w/2.2,y-w/1.55);
  canvas.quadraticCurveTo(x-w/4.5,y-w/1.2,x-w/5.5, y-w/3);

  canvas.moveTo(x+w/5, y-w/2.1);
  canvas.bezierCurveTo(x+w/10,y,x+w/1.6,y,x+w/1.8,y-w/2.5);
  canvas.quadraticCurveTo(x+w/2.3,y-w/1.2,x+w/3.8,y-w/1.55);
  canvas.quadraticCurveTo(x+w/3,y-w/1.5,x+w/3,y-w/2);
  canvas.quadraticCurveTo(x+w/4,y-w/3.5,x+w/5, y-w/2.1);
  canvas.fill();
  canvas.closePath();
}

// Request Animation Frame Fix from http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating on 03/01/2014                      
(function() {
  var lastTime = 0;
  var vendors = ['ms', 'moz', 'webkit', 'o'];
  for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
      window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
      window.cancelRequestAnimationFrame = window[vendors[x]+
        'CancelRequestAnimationFrame'];
  }

  if (!window.requestAnimationFrame)
      window.requestAnimationFrame = function(callback, element) {
          var currTime = new Date().getTime();
          var timeToCall = Math.max(0, 16 - (currTime - lastTime));
          var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
            timeToCall);
          lastTime = currTime + timeToCall;
          return id;
      };

  if (!window.cancelAnimationFrame)
      window.cancelAnimationFrame = function(id) {
          clearTimeout(id);
};
}())      