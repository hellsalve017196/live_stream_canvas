 function getFirebase() {
      return new Firebase("sanggangsang.firebaseio.com");
    }

    $(document).ready(function () {
      // Set up some globals
      var pixSize = 4, lastPoint = null, currentColor = "F20F12", mouseDown = 0;

      // Create a reference to the pixel data for our drawing.
      var pixelDataRef = getFirebase();

      // Add clear handler
      $('#clear').click(function() {
        $('#drawing-canvas').get(0).getContext('2d').clearRect(0, 0, 100, 150);
        pixelDataRef.set(null);
      });


      // adding color
      $('#color').on('change',function() {
          currentColor = $(this).val();
      })

      // font size
      $("#size").on('change',function() {
          pixSize = $(this).val();
      })

      // Set up our canvas
      var myCanvas = document.getElementById('drawing-canvas');
      var myContext = myCanvas.getContext ? myCanvas.getContext('2d') : null;
      if (myContext == null) {
        alert("You must use a browser that supports HTML5 Canvas to run this demo.");
        return;
      }

      // Keep track of if the mouse is up or down.
      myCanvas.onmousedown = function () { mouseDown = 1; return false; };
      myCanvas.onmouseout = myCanvas.onmouseup = function () {
        mouseDown = 0, lastPoint = null;
      };

      // Disable text selection.
      myCanvas.onselectstart = function() { return false; };

      // Draw a line from the mouse's last position to its current position.
      var drawLineOnMouseMove = function(e) {

        console.log(currentColor);

        if (!mouseDown) return;

        // Bresenham's line algorithm. We use this to ensure smooth lines are drawn.
        var offset = $('canvas').offset();
        var x1 = Math.floor((e.pageX - offset.left) / pixSize - 1),
          y1 = Math.floor((e.pageY - offset.top) / pixSize - 1);
        var x0 = (lastPoint == null) ? x1 : lastPoint[0];
        var y0 = (lastPoint == null) ? y1 : lastPoint[1];
        var dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
        var sx = (x0 < x1) ? 1 : -1, sy = (y0 < y1) ? 1 : -1, err = dx - dy;
        while (true) {
          // Write the pixel into Firebase, or if we are drawing white, remove the pixel.
          pixelDataRef.child(x0 + ":" + y0).set({  color : currentColor === "fff" ? null : currentColor, size:pixSize  });

          if (x0 == x1 && y0 == y1) break;
          var e2 = 2 * err;
          if (e2 > -dy) {
            err = err - dy;
            x0 = x0 + sx;
          }
          if (e2 < dx) {
            err = err + dx;
            y0 = y0 + sy;
          }
        }
        lastPoint = [x1, y1];
      }
      $(myCanvas).mousemove(drawLineOnMouseMove);
      $(myCanvas).mousedown(drawLineOnMouseMove);

      // Add callbacks that are fired any time the pixel data changes and adjusts the canvas appropriately.
      // Note that child_added events will be fired for initial pixel data as well.
      var drawPixel = function(snapshot) {
        var coords = snapshot.name().split(":");
        var data = snapshot.val();
        myContext.fillStyle = "#" + data.color;
        pixSize = data.size;
        myContext.fillRect(parseInt(coords[0]) * pixSize, parseInt(coords[1]) * pixSize, pixSize, pixSize);
      }
      var clearPixel = function(snapshot) {
        var coords = snapshot.name().split(":");
        var data = snapshot.val();
        pixSize = data.size;
        myContext.clearRect(parseInt(coords[0]) * pixSize, parseInt(coords[1]) * pixSize, pixSize, pixSize);
      }
      
      pixelDataRef.on('child_added', drawPixel);
      pixelDataRef.on('child_changed', drawPixel);
      pixelDataRef.on('child_removed', clearPixel);
    });