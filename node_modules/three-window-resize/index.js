module.exports = function (renderer, camera, dimension) {

  /**
   * @author jeromeetienne / https://github.com/jeromeetienne
   * @author SebastianNette / https://github.com/SebastianNette
   */

	dimension = dimension || function () {
    return {
      width: window.innerWidth,
      height: window.innerHeight
    }
  }

	var callback	= function(){
		// fetch target renderer size
		var rendererSize = dimension();

		// notify the renderer of the size change
		renderer.setSize(rendererSize.width, rendererSize.height)

		// update the camera
		camera.aspect	= rendererSize.width / rendererSize.height
		camera.updateProjectionMatrix()
	}

	// bind the resize event
	window.addEventListener('resize', callback, false)

	// return .stop() the function to stop watching window resize
	return {
		trigger	: function(){
			callback()
		},
  // Stop watching window resize
		destroy	: function(){
			window.removeEventListener('resize', callback)
		}
	}

}
