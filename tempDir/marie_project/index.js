/**
 *  Picks a random element from an array.
 *  @returns {number} index of array, {object} element at arr[i]
 *  @param {object[]} array we want to randomly choose one element from
 */
function getRandomElement(arr) {
  const i = Math.floor(Math.random() * arr.length);
  return [i, arr[i]];
}

/**
 *  Element Handler taken from documentation:
 *  https://developers.cloudflare.com/workers/reference/apis/html-rewriter/#element-handlers
 */
class ElementHandler {

  constructor(variant) {
    this.variant = variant;
  }

  element(element) {
    var varOne = ["I love horses!", "I got my pilot's license in High School.",
    "I have a 4.0 :P",
    "I managed to get another internship after my internship with Checkr was cancelled. But that internship was also cancelled!",
    "I Love to Code :))"]

    var varTwo = ["Thanks for everything, this was fun :)!", "Stay safe!", "Wash your hands!",
              "Wear a mask!"];

    if (element.tagName == 'title'){
      element.setInnerContent("Marie's Submission!")
    }

    if (element.getAttribute('id') == "title"){
      element.setInnerContent("Hi! Keep Refreshing!");
    }

    if (element.getAttribute('id') == "description"){
      if (this.variant == 1){
        const[index, phrase] = getRandomElement(varOne);
        element.setInnerContent(phrase);
      } else {
        const[index, phrase] = getRandomElement(varTwo);
        element.setInnerContent(phrase);
      }
    }

    if (element.getAttribute('id') == "url") {
      element.setInnerContent("Made with <3 by Marie");
      element.setAttribute("href", "https://github.com/mpetitjean22");
    }
  }
}

/**
 * Gets the value of a specified cookied.
 * @returns value of the cookie
 * @param {Request} request holding the cookie
 * @param {String} name of the cookie
 *  NOTE: code taken from documentation
 *  https://developers.cloudflare.com/workers/templates/pages/cookie_extract/
 */
function getCookie(request, name) {
  let result = null
  let cookieString = request.headers.get('Cookie')
  if (cookieString) {
    let cookies = cookieString.split(';')
    cookies.forEach(cookie => {
      let cookieName = cookie.split('=')[0].trim()
      if (cookieName === name) {
        let cookieVal = cookie.split('=')[1]
        result = cookieVal
      }
    })
  }
  return result
}

/**
 * Adds a cookie to a response
 * @returns {Response} new response with coookie in headers
 * @param {Response} response we are putting the cookie to
 * @param {String} value full string for cookie
 */
function setCookie(response, value) {
  response = new Response(response.body, response);
  response.headers.set('Set-Cookie', value);
  return response;
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

/**
 * Respond with hello worker text
 * @param {Request} request
 */
async function handleRequest(request) {
  const currCookie = getCookie(request, 'variant');

  const response = await fetch('https://cfw-takehome.developers.workers.dev/api/variants');
  const jsonResponse = await response.json();
  const variants = jsonResponse.variants;

  /* Cookie has previously been set */
  if (currCookie !== null){
    let prevResponse = await fetch(variants[currCookie]);
    return new HTMLRewriter().on('*', new ElementHandler(currCookie)).transform(prevResponse);
  }

  /* Cookie has not been previously set */
  const [index, url] = getRandomElement(variants);
  const variantCookie = `variant=${index};`

  let variantResponse = await fetch(url);
  let result = await new HTMLRewriter().on('*', new ElementHandler(index)).transform(variantResponse);

  return setCookie(result, variantCookie);
}
