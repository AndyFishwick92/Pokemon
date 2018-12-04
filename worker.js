onmessage = function(e){
  var imageData = e.data;
  var i, r, g, b, a;
  for(i = 0, l = imageData.data.length / 4; i < l; i++){
        r = imageData.data[i * 4];
        g = imageData.data[i * 4 + 1];
        b = imageData.data[i * 4 + 2];
        a = imageData.data[i * 4 + 3];
        r = g = b = Math.floor((r+g+b)/3);
        imageData.data[i * 4] = r;
        imageData.data[i * 4 + 1] = g;
        imageData.data[i * 4 + 2] = b;
  }
  console.log('used web worker to pixel push');
  postMessage(imageData);
};